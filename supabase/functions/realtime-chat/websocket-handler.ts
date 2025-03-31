
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
  
  try {
    console.log("[WebSocket Handler] Processing WebSocket request");
    
    // Handle the WebSocket upgrade request - SIMPLIFIED WITHOUT PROTOCOLS
    const upgradeResult = await handleUpgrade(req);
    
    // If the result is a Response, it means there was an error during upgrade
    if (upgradeResult instanceof Response) {
      console.log("[WebSocket Handler] Upgrade failed, returning error response");
      return upgradeResult;
    }
    
    // We have a successful WebSocket connection
    const { socket, response } = upgradeResult;
    
    // Send an immediate message to the client to confirm the connection
    try {
      socket.send(JSON.stringify({ 
        type: "connection.initialized", 
        message: "WebSocket connection initialized",
        timestamp: new Date().toISOString()
      }));
      console.log("[WebSocket Handler] Sent initial connection message to client");
    } catch (e) {
      console.error("[WebSocket Handler] Error sending initial message:", e);
    }
    
    // Set up initial error and close handlers for debugging
    socket.onerror = (event) => {
      console.error("[WebSocket Handler] Socket error:", event);
    };

    socket.onclose = (event) => {
      console.log(`[WebSocket Handler] Socket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
    };
    
    // Add a basic message handler for pings
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[WebSocket Handler] Received message:", data.type || "unknown type");
        
        // Handle ping messages immediately with a pong
        if (data.type === "ping") {
          socket.send(JSON.stringify({
            type: "pong",
            timestamp: new Date().toISOString(),
            echo: data.timestamp
          }));
          console.log("[WebSocket Handler] Responded with pong");
        }
      } catch (error) {
        console.error("[WebSocket Handler] Error handling message:", error);
      }
    };
    
    // CRITICAL FIX: Initialize connections asynchronously AFTER returning the response
    // This prevents any delay in returning the 101 Switching Protocols response
    setTimeout(() => {
      try {
        initializeConnections(socket);
        console.log("[WebSocket Handler] Connection initialization completed");
      } catch (error) {
        console.error("[WebSocket Handler] Error during connection initialization:", error);
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
          console.error("[WebSocket Handler] Failed to send error message:", e);
        }
      }
    }, 0);
    
    // Return the response immediately for a successful WebSocket handshake
    console.log("[WebSocket Handler] Returning WebSocket upgrade response");
    return response;
  } catch (error) {
    console.error("[WebSocket Handler] Critical error:", error);
    return new Response(JSON.stringify({
      error: "WebSocket connection failed",
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
}
