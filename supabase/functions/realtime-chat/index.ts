
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

import { handleCorsPreflightRequest } from "./utils.ts";
import { handleWebSocketRequest } from "./websocket-handler.ts";
import { handleHttpRequest } from "./http-handler.ts";

serve(async (req) => {
  console.log(`Received ${req.method} request to ${req.url}`);
  
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
    return handleWebSocketRequest(req);
  }

  // Fall back to HTTP request handling
  console.log("Handling HTTP request");
  return handleHttpRequest(req);
});
