
// Common utility functions and constants for the realtime chat edge function

// CORS headers for all responses
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to handle CORS preflight requests
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

// Helper to create error responses
export function createErrorResponse(error: Error | string, status = 500): Response {
  console.error("Error:", error);
  const message = error instanceof Error ? error.message : String(error);
  
  return new Response(JSON.stringify({ 
    error: message,
    details: "There was an error processing your request. Please check if the OpenAI API key is configured correctly and the service is available."
  }), {
    status: status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Helper to check for required API key
export function getOpenAIApiKey(): string {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('API key not configured');
  }
  return apiKey;
}

// Helper to create a success response
export function createSuccessResponse(data: any): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
