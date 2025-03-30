
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { handleCorsPreflightRequest } from "./utils.ts";
import { handleWebSocketRequest } from "./websocket-handler.ts";
import { handleHttpRequest } from "./http-handler.ts";

serve(async (req) => {
  try {
    console.log(`Received ${req.method} request to ${req.url}`);
    console.log("Headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
    
    // Handle CORS preflight requests
    const corsResponse = handleCorsPreflightRequest(req);
    if (corsResponse) {
      console.log("Responding to CORS preflight request");
      return corsResponse;
    }

    // Handle WebSocket upgrades
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() === "websocket") {
      console.log("Handling WebSocket upgrade request");
      try {
        return await handleWebSocketRequest(req);
      } catch (wsError) {
        console.error("Error in WebSocket handler:", wsError);
        console.error("Error details:", JSON.stringify({
          name: wsError.name,
          message: wsError.message,
          stack: wsError.stack
        }));
        return new Response(JSON.stringify({
          error: "WebSocket handler error",
          details: wsError instanceof Error ? wsError.message : String(wsError)
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Fall back to HTTP request handling
    console.log("Handling HTTP request");
    return handleHttpRequest(req);
  } catch (error) {
    console.error("Unhandled error in edge function:", error);
    console.error("Error details:", JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack
    }));
    
    return new Response(JSON.stringify({
      error: "Unhandled error in edge function",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
