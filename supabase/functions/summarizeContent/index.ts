
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

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

    // Prepare the prompt for OpenAI
    const prompt = `
      Create a concise summary (maximum 200 words) of the following text about therapeutic concepts.
      Focus on the core ideas, techniques, and principles, especially those related to Terry Real's work on relationships.
      The summary should be clear, informative, and highlight the most important concepts.
      
      Text: ${text}
    `;

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!openAIResponse.ok) {
      const errorText = await openAIResponse.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const openAIData = await openAIResponse.json();
    const summary = openAIData.choices[0].message.content.trim();

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
