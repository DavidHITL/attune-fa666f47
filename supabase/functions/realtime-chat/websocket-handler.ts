
import { corsHeaders, createErrorResponse, logWithTimestamp, isWebSocketUpgrade } from "./utils.ts";
import { handleUpgrade } from "./handlers/upgrade-handler.ts";
import { initializeConnections } from "./handlers/connection-initializer.ts";
import { WebSocketOptions, defaultOptions } from "./types.ts";

/**
 * Handle WebSocket upgrade requests and manage the connection to OpenAI's Realtime API
 */
export async function handleWebSocketRequest(req: Request, options: WebSocketOptions = defaultOptions): Promise<Response> {
  // Allow CORS preflight for websockets
  if (req.method === "OPTIONS") {
    logWithTimestamp("[WebSocket Handler] Handling OPTIONS request");
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sec-websocket-protocol, upgrade"
      }
    });
  }
  
  try {
    logWithTimestamp("[WebSocket Handler] Processing WebSocket request");
    
    // Check if this is a WebSocket upgrade request
    if (!isWebSocketUpgrade(req.headers)) {
      logWithTimestamp("[WebSocket Handler] Not a WebSocket upgrade request, returning 400", "error");
      return createErrorResponse("Expected WebSocket upgrade", 400);
    }
    
    // Log request headers for debugging
    const headers = Object.fromEntries(req.headers.entries());
    logWithTimestamp(`[WebSocket Handler] Request headers: ${JSON.stringify(headers)}`);
    
    // Handle the WebSocket upgrade request
    const upgradeResult = await handleUpgrade(req);
    
    // If the result is a Response, it means there was an error during upgrade
    if (upgradeResult instanceof Response) {
      logWithTimestamp("[WebSocket Handler] Upgrade failed, returning error response", "error");
      return upgradeResult;
    }
    
    // We have a successful WebSocket connection
    const { socket, response } = upgradeResult;
    
    logWithTimestamp("[WebSocket Handler] WebSocket connection established successfully");
    
    // Add basic error handling for the connection
    socket.onerror = (event) => {
      logWithTimestamp("[WebSocket Handler] Socket error event received", "error");
    };

    socket.onclose = (event) => {
      logWithTimestamp(`[WebSocket Handler] Socket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
    };
    
    // Send an immediate message to the client to confirm the connection
    try {
      socket.send(JSON.stringify({ 
        type: "connection.initialized", 
        message: "WebSocket connection initialized",
        timestamp: new Date().toISOString()
      }));
      logWithTimestamp("[WebSocket Handler] Sent initial connection message to client");
    } catch (e) {
      logWithTimestamp("[WebSocket Handler] Error sending initial message: " + (e instanceof Error ? e.message : String(e)), "error");
    }
    
    // Add a basic message handler for pings
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        logWithTimestamp("[WebSocket Handler] Received message type: " + (data.type || "unknown type"));
        
        // Handle ping messages immediately with a pong
        if (data.type === "ping") {
          socket.send(JSON.stringify({
            type: "pong",
            timestamp: new Date().toISOString(),
            echo: data.timestamp
          }));
          logWithTimestamp("[WebSocket Handler] Responded with pong");
        }
      } catch (error) {
        logWithTimestamp("[WebSocket Handler] Error handling message: " + (error instanceof Error ? error.message : String(error)), "error");
      }
    };
    
    // Initialize connections asynchronously AFTER returning the response
    setTimeout(() => {
      try {
        logWithTimestamp("[WebSocket Handler] Starting connection initialization");
        initializeConnections(socket);
        logWithTimestamp("[WebSocket Handler] Connection initialization completed");
      } catch (error) {
        logWithTimestamp("[WebSocket Handler] Error during connection initialization: " + (error instanceof Error ? error.message : String(error)), "error");
        try {
          if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({ 
              type: "error", 
              error: "Connection initialization error",
              details: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            }));
          }
        } catch (e) {
          logWithTimestamp("[WebSocket Handler] Failed to send error message: " + (e instanceof Error ? e.message : String(e)), "error");
        }
      }
    }, 0);
    
    // Return the response immediately for a successful WebSocket handshake
    logWithTimestamp("[WebSocket Handler] Returning WebSocket upgrade response");
    return response;
  } catch (error) {
    logWithTimestamp("[WebSocket Handler] Critical error: " + (error instanceof Error ? error.message : String(error)), "error");
    return createErrorResponse("WebSocket connection failed: " + (error instanceof Error ? error.message : String(error)), 500);
  }
}
