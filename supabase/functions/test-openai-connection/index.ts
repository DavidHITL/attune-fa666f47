
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
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not set in environment variables');
    }

    // Test the OpenAI API connection with a simple models list request
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API returned error: ${response.status} ${response.statusText}`);
      console.error(`Error details: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    // Get the response data
    const data = await response.json();
    
    // Return a subset of the data (don't expose all models)
    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'Connection to OpenAI API successful',
        modelCount: data.data ? data.data.length : 0,
        hasRealtimeModels: data.data ? data.data.some((model: any) => model.id.includes('realtime')) : false
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error(`Error testing OpenAI connection: ${error.message}`);
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        error: `Failed to connect to OpenAI API: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
