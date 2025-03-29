
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const anthropicApiKey = Deno.env.get("anthropic-attune-api-key");
    
    if (!anthropicApiKey) {
      console.error("Missing API key: anthropic-attune-api-key not set");
      return new Response(
        JSON.stringify({
          error: "API key configuration error",
          success: false,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Parse request body
    const { text } = await req.json();
    
    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({
          error: "Text parameter is required and must be a string",
          success: false,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Call Claude API to generate summary
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1500,
        system: `You are an expert in relational therapy and relationship psychology, particularly Terry Real's methodology.
        Your task is to create a comprehensive summary of the provided text that captures the key concepts, techniques, and insights.
        
        Summarization guidelines:
        1. Create a 250-400 word summary that preserves the core therapeutic concepts
        2. Highlight key relationship patterns, strategies, and frameworks mentioned
        3. Maintain the original terminology used by Terry Real
        4. Structure the summary with clear paragraphs focusing on different aspects
        5. Include specific techniques or interventions mentioned
        6. Keep the summary focused on practical applications for therapy or relationships`,
        messages: [
          {
            role: "user",
            content: `Summarize the following text by Terry Real, capturing the key therapeutic concepts and practical insights:
            
            ${text.substring(0, 10000)} // Limit to prevent token overflow
            
            Create a comprehensive summary that would be useful for therapists or individuals studying Terry Real's relational life therapy approach.`
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error response:", errorText);
      throw new Error(`API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const summary = data.content[0].text;

    return new Response(
      JSON.stringify({
        summary: summary,
        success: true,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in summarizeContent function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
