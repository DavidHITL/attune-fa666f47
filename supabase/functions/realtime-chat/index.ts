
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { handleWebSocketRequest } from "./websocket-handler.ts";
import { handleHttpRequest } from "./http-handler.ts";
import { handleCorsPreflightRequest } from "./utils.ts";

serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
  // Log request headers for debugging
  const headerEntries = Array.from(req.headers.entries());
  console.log("Request headers:", JSON.stringify(Object.fromEntries(headerEntries)));
  
  // Handle CORS preflight requests
  const corsResponse = handleCorsPreflightRequest(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Handle WebSocket upgrade requests
  const upgradeHeader = req.headers.get("upgrade") || "";
  if (upgradeHeader.toLowerCase() === "websocket") {
    return handleWebSocketRequest(req);
  }

  // Handle regular HTTP requests (for testing/health checks)
  return handleHttpRequest(req);
});
