
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

// Function to generate a secure random string
function generateSecureToken(length: number = 32): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length];
  }
  return result;
}

// Main server function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createResponse({ error: "Missing authorization header" }, 401);
    }

    // Create Supabase client with the authorization header
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication error:", authError);
      return createResponse({ error: "Unauthorized access" }, 401);
    }

    // Generate ephemeral API key
    const ephemeralKey = generateSecureToken(40);
    
    // Set expiration time (1 minute from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1);
    
    // Store the ephemeral key in Supabase with user ID and expiration
    const { error: insertError } = await supabase
      .from('ephemeral_keys')
      .insert({
        user_id: user.id,
        key: ephemeralKey,
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });
      
    if (insertError) {
      console.error("Error storing ephemeral key:", insertError);
      return createResponse({ error: "Failed to generate ephemeral key" }, 500);
    }

    // Return the ephemeral key to the client
    return createResponse({
      ephemeralKey,
      expiresAt: expiresAt.toISOString()
    });
    
  } catch (error) {
    console.error("Error in generate-ephemeral-key function:", error);
    return createResponse({ error: "Internal server error" }, 500);
  }
});
