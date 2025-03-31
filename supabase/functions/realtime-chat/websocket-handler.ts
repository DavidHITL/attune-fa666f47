
import { corsHeaders } from "./utils.ts";
import { handleUpgrade } from "./handlers/upgrade-handler.ts";
import { initializeConnections } from "./handlers/connection-initializer.ts";
import { WebSocketOptions, defaultOptions } from "./types.ts";

/**
 * Handle WebSocket upgrade requests and manage the connection to OpenAI's Realtime API
 */
export async function handleWebSocketRequest(req: Request, options: WebSocketOptions = defaultOptions): Promise<Response> {
  // Allow CORS preflight for websockets
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sec-websocket-protocol, upgrade"
      }
    });
  }
  
  // Handle the WebSocket upgrade request
  const upgradeResult = await handleUpgrade(req);
  
  // If the result is a Response, it means there was an error during upgrade
  if (upgradeResult instanceof Response) {
    return upgradeResult;
  }
  
  // We have a successful WebSocket connection
  const { socket, response } = upgradeResult;
  
  // Set up initial error and close handlers for debugging
  socket.onerror = (event) => {
    console.error("[WebSocket Handler] Socket error:", event);
  };

  socket.onclose = (event) => {
    console.log(`[WebSocket Handler] Socket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
  };
  
  // Initialize connections and handlers
  initializeConnections(socket);
  
  return response;
}
