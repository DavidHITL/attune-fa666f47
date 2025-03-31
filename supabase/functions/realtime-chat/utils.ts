
// Utils for the realtime-chat edge function

// CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a standard error response
export function createErrorResponse(error: any): Response {
  console.error("Error details:", JSON.stringify({
    name: error.name,
    message: error.message,
    stack: error.stack
  }));
  
  return new Response(
    JSON.stringify({
      error: "An error occurred",
      details: error instanceof Error ? error.message : String(error),
      time: new Date().toISOString()
    }),
    {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

// Get the OpenAI API key from environment variables
export function getOpenAIApiKey(): string {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  return apiKey;
}

// Handle CORS preflight requests
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  return null;
}
