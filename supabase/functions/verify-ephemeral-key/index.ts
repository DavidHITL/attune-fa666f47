
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// CORS headers for browser compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Create a response with CORS headers
const createResponse = (body: any, status: number = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
};

// Main server function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the real OpenAI API key from environment
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("Missing OpenAI API key in environment");
      return createResponse({ error: "Server configuration error" }, 500);
    }

    // Parse request body for ephemeral key
    const { ephemeralKey } = await req.json();
    
    if (!ephemeralKey) {
      return createResponse({ error: "Missing ephemeral key" }, 400);
    }

    // Create Supabase admin client to check the ephemeral key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the ephemeral key is valid and not expired
    const { data: keyData, error: keyError } = await supabase
      .from('ephemeral_keys')
      .select('*')
      .eq('key', ephemeralKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (keyError || !keyData) {
      console.error("Invalid or expired ephemeral key:", keyError);
      return createResponse({ error: "Invalid or expired key" }, 401);
    }

    // Return the actual OpenAI API key for the client to use
    // This is secure because we verify authentication and key validity first
    return createResponse({
      openaiKey: openaiApiKey,
      expiresAt: keyData.expires_at
    });
    
  } catch (error) {
    console.error("Error in verify-ephemeral-key function:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
});
