
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { handleRequest } from "./handler.ts";
import { corsHeaders } from "./cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    return await handleRequest(req);
  } catch (error) {
    console.error("Error in generateChatResponse function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
