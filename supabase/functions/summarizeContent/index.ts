
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("anthropic") || "";

interface RequestBody {
  text: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Parse the request body
    const body: RequestBody = await req.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No text provided",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Call Claude API instead of OpenAI
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `Create a concise summary (maximum 200 words) of the following text about therapeutic concepts.
            Focus on the core ideas, techniques, and principles, especially those related to Terry Real's work on relationships.
            The summary should be clear, informative, and highlight the most important concepts.
            
            Text: ${text}`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      throw new Error(`Claude API error: ${errorText}`);
    }

    const claudeData = await claudeResponse.json();
    const summary = claudeData.content[0].text.trim();

    return new Response(
      JSON.stringify({
        success: true,
        summary: summary,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error summarizing content:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
