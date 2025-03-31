
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[Token Generator] Processing token request");
    
    // Get request body
    const { voice = "alloy", instructions = "You are a helpful assistant." } = await req.json();
    
    console.log("[Token Generator] Requesting token with voice:", voice);
    
    // Get OpenAI API key from environment
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not configured');
    }
    
    // Create a session with OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: voice,
        instructions: instructions
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("[Token Generator] OpenAI API error:", response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    console.log("[Token Generator] Successfully generated token");
    
    // Return the session data
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error("[Token Generator] Error:", error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred',
        details: error.stack || 'No stack trace available' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
