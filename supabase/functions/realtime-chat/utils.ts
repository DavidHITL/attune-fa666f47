
// Define CORS headers for use in the function
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, sec-websocket-protocol, upgrade',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Helper to get the OpenAI API key
export function getOpenAIApiKey(): string {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY environment variable");
    throw new Error("OpenAI API key not configured");
  }
  
  return apiKey;
}

// Handle CORS preflight requests
export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Max-Age": "86400", // 24 hours
      }
    });
  }
  return null;
}

// Error handling helper
export function createErrorResponse(error: unknown): Response {
  return new Response(
    JSON.stringify({
      error: "An unexpected error occurred",
      message: error instanceof Error ? error.message : String(error),
    }),
    {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}
