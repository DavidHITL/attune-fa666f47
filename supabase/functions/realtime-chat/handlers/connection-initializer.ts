import { corsHeaders } from "../utils.ts";

/**
 * Initialize WebSocket connection handling
 */
export function initializeConnections(socket: WebSocket): void {
  console.log("[Connection Initializer] Setting up WebSocket communication");
  
  try {
    // Send heartbeat pings every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: "ping",
          timestamp: new Date().toISOString()
        }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
    
    // Handle socket closure
    socket.onclose = (event) => {
      console.log(`[Connection Initializer] Socket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
      clearInterval(pingInterval);
    };
    
    // Enhanced message handler
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(`[Connection Initializer] Received message type: ${data.type || "unknown"}`);
        
        // Handle ping messages
        if (data.type === "ping") {
          socket.send(JSON.stringify({
            type: "pong",
            timestamp: new Date().toISOString(),
            echo: data.timestamp
          }));
        }
      } catch (error) {
        console.error("[Connection Initializer] Error handling message:", error);
        
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({
            type: "error",
            error: "Failed to process message",
            timestamp: new Date().toISOString()
          }));
        }
      }
    };
    
    // Notify client that initialization is complete
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({
        type: "connection.ready",
        message: "WebSocket connection fully initialized",
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error("[Connection Initializer] Error in connection setup:", error);
    
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({
        type: "error",
        error: "Connection initialization error",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      }));
    }
  }
}
