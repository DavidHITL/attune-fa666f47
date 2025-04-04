
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.23.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }
  
  try {
    // Create Supabase client to verify authentication
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Verify the user is authenticated
    const authHeader = req.headers.get('Authorization');
    let userId = 'anonymous';
    
    if (authHeader) {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        
        if (user && !authError) {
          userId = user.id;
          console.log(`Processing request for authenticated user: ${userId}`);
        } else {
          console.log('Auth token present but invalid:', authError?.message);
        }
      } catch (authCheckError) {
        console.warn('Error checking authentication:', authCheckError);
        // Continue as anonymous
      }
    } else {
      console.log('No Authorization header - proceeding with anonymous access');
    }
    
    // Get the OpenAI API key from environment variable
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY environment variable not set');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get parameters from request body
    let params;
    try {
      params = await req.json();
    } catch (e) {
      params = {};
    }
    
    const model = params.model || "gpt-4o-realtime-preview-2024-12-17";
    const voice = params.voice || "alloy";
    const instructions = params.instructions || "You are a helpful assistant. Be concise in your responses.";
    // Accept userId from client, but fall back to the one detected from auth
    const userIdFromClient = params.userId;
    const effectiveUserId = userIdFromClient || userId;
    
    console.log(`Generating ephemeral key for OpenAI API with model: ${model}, voice: ${voice}`);
    console.log(`Using instructions of length: ${instructions?.length || 0} characters`);
    if (userIdFromClient) {
      console.log(`Using userId from client: ${userIdFromClient.substring(0, 8)}...`);
    }
    
    console.time('OpenAI Session Creation');
    
    // FIXED: Use the correct endpoint for realtime sessions
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        voice: voice,
        instructions: instructions
      }),
    })
    
    console.timeEnd('OpenAI Session Creation');
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error (${response.status}):`, errorText);
      
      // Provide more specific error message for common errors
      let errorMessage = `Failed to generate ephemeral key: ${response.status} ${response.statusText}`;
      
      if (response.status === 401 || response.status === 403) {
        errorMessage = "Authentication failed with OpenAI API. Please check your API key.";
      } else if (response.status === 429) {
        errorMessage = "OpenAI API rate limit exceeded. Please try again later.";
      } else if (response.status >= 500) {
        errorMessage = "OpenAI API service error. Please try again later.";
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorText
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const data = await response.json();
    
    // FIXED: Validate the response contains a valid client_secret
    if (!data.client_secret?.value || !data.client_secret?.expires_at) {
      console.error('Invalid response format from OpenAI:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid response format from OpenAI',
          details: 'Missing client_secret or expires_at'
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    const expiresAt = new Date(data.client_secret.expires_at * 1000).toISOString();
    console.log('Successfully generated ephemeral key, expires at:', expiresAt);
    
    // Check expiration time is at least 30 seconds in the future
    const expiresInSeconds = Math.floor((data.client_secret.expires_at * 1000 - Date.now()) / 1000);
    if (expiresInSeconds < 30) {
      console.warn(`Warning: Ephemeral key expires soon (${expiresInSeconds} seconds)`);
    }
    
    // Log partial key for debugging (first 5 chars only for security)
    const keyPreview = data.client_secret.value.substring(0, 5);
    console.log(`Generated key preview: ${keyPreview}..., length: ${data.client_secret.value.length}, valid for: ${expiresInSeconds}s`);
    
    // FIXED: Expose the key properly in the response
    return new Response(
      JSON.stringify({
        key: data.client_secret.value,
        expires_at: expiresAt,
        metadata: {
          expires_in_seconds: expiresInSeconds,
          created_for: effectiveUserId,
          created_at: new Date().toISOString(),
          model: model,
          voice: voice
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating ephemeral key:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate ephemeral key',
        message: error instanceof Error ? error.message : String(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
})
