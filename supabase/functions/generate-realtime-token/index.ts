
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("[Token Generator] Handling OPTIONS preflight request");
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }
  
  // Basic health check endpoint for HTTP GET
  if (req.method === "GET" && !req.headers.get("upgrade")) {
    console.log("[Token Generator] Handling HTTP GET request");
    return new Response(JSON.stringify({ 
      status: "ok", 
      message: "Token generator endpoint is running" 
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }

  try {
    console.log("[Token Generator] Processing token request");
    
    // Get the request payload (system instructions, voice, etc.)
    const { instructions = "You are a helpful AI assistant.", voice = "alloy" } = await req.json();
    
    // Get OpenAI API key from environment variables
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      console.error("[Token Generator] OpenAI API key not found");
      throw new Error('OpenAI API Key not configured');
    }

    console.log(`[Token Generator] Requesting token with voice: ${voice}`);
    
    // Request an ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17", // Latest model as of now
        voice: voice,
        instructions: instructions
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Token Generator] OpenAI API error: ${response.status} ${errorText}`);
      throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("[Token Generator] Successfully generated token");
    
    // Return only what's needed by the client
    return new Response(JSON.stringify({
      success: true,
      client_secret: data.client_secret,
      session_id: data.id,
      expires_at: data.expires_at
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error("[Token Generator] Error:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});
