
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
      Extract the most important keywords and key phrases from the following text about therapeutic concepts. 
      Focus on psychological terms, therapeutic techniques, relationship patterns, and concepts specific to Terry Real's work.
      Return only the keywords as a JSON array, maximum 10 keywords.
      
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
    
    // Extract and parse the keywords from the response
    const responseText = openAIData.choices[0].message.content;
    
    // Try to parse the JSON array from the response
    let keywords;
    try {
      // Try to extract JSON array if it's wrapped in text
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON array found, split by commas or newlines
        keywords = responseText.split(/,|\n/).map(k => k.trim()).filter(Boolean);
      }
      
      // Clean up any remaining quotes or punctuation
      keywords = keywords.map(k => k.replace(/^["'\s]+|["'\s]+$/g, '').trim());
      
      // Remove any empty strings
      keywords = keywords.filter(Boolean);
      
      // Limit to 10 keywords
      keywords = keywords.slice(0, 10);
    } catch (error) {
      console.error("Error parsing keywords:", error);
      keywords = [];
    }

    return new Response(
      JSON.stringify({
        success: true,
        keywords: keywords,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error extracting keywords:", error);
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
