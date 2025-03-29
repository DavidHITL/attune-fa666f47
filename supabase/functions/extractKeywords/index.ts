
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

    // Call Claude API to extract keywords
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        system: `You are an expert in relational therapy and relationship psychology, particularly Terry Real's methodology. 
        Your task is to extract the most important keywords and concepts from the provided text.
        
        Rules:
        1. Extract 5-15 keywords or key phrases that best represent the concepts in the text
        2. Focus on therapeutic concepts, relationship patterns, and psychological frameworks
        3. Format the response as a JSON array of strings containing only the keywords
        4. Do not include descriptions, just the keywords themselves
        5. Use the exact terminology as it appears in the text when possible
        6. Keep each keyword or key phrase concise (1-4 words)`,
        messages: [
          {
            role: "user",
            content: `Extract the key therapeutic concepts and keywords from this text by Terry Real:
            
            ${text.substring(0, 8000)} // Limit to prevent token overflow
            
            Return ONLY a JSON array of strings with the keywords, with no additional text or formatting.`
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
    let extractedText = data.content[0].text;
    
    // Try to parse the JSON array from Claude's response
    let keywords = [];
    try {
      // Remove any markdown formatting and find the JSON array in the response
      const jsonMatch = extractedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array is found, try another approach
        const lines = extractedText.split('\n').filter(line => line.trim().startsWith('"') || line.trim().startsWith('-'));
        if (lines.length > 0) {
          keywords = lines.map(line => line.replace(/^["-\s]+|[",\s]+$/g, ''));
        }
      }
      
      // Ensure keywords is an array
      if (!Array.isArray(keywords)) {
        keywords = [];
      }
      
      // Clean up keywords
      keywords = keywords
        .map(k => k.trim())
        .filter(k => k.length > 0)
        .slice(0, 20); // Limit to 20 keywords
        
    } catch (parseError) {
      console.error("Error parsing keywords:", parseError);
      console.log("Raw response:", extractedText);
      keywords = [];
    }

    return new Response(
      JSON.stringify({
        keywords: keywords,
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
    console.error("Error in extractKeywords function:", error);
    
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
