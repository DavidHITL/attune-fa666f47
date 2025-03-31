
import { corsHeaders, logWithTimestamp } from "../utils.ts";

/**
 * Initialize WebSocket connection handling
 */
export function initializeConnections(socket: WebSocket): void {
  logWithTimestamp("[Connection Initializer] Setting up WebSocket communication");
  
  try {
    // Send heartbeat pings every 30 seconds to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        logWithTimestamp("[Connection Initializer] Sending heartbeat ping");
        socket.send(JSON.stringify({
          type: "ping",
          timestamp: new Date().toISOString()
        }));
      } else {
        logWithTimestamp("[Connection Initializer] Socket no longer open, clearing ping interval", "warn");
        clearInterval(pingInterval);
      }
    }, 30000);
    
    // Handle socket closure
    socket.onclose = (event) => {
      logWithTimestamp(`[Connection Initializer] Socket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
      clearInterval(pingInterval);
    };
    
    // Enhanced message handler
    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        logWithTimestamp(`[Connection Initializer] Received message type: ${data.type || "unknown"}`);
        
        // Handle ping messages
        if (data.type === "ping") {
          socket.send(JSON.stringify({
            type: "pong",
            timestamp: new Date().toISOString(),
            echo: data.timestamp
          }));
          logWithTimestamp("[Connection Initializer] Responded with pong");
        }
        
        // Log other message types for debugging
        else {
          logWithTimestamp(`[Connection Initializer] Processing message of type: ${data.type}`);
        }
      } catch (error) {
        logWithTimestamp("[Connection Initializer] Error handling message: " + (error instanceof Error ? error.message : String(error)), "error");
        
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({
            type: "error",
            error: "Failed to process message",
            details: error instanceof Error ? error.message : String(error),
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
      logWithTimestamp("[Connection Initializer] Sent connection ready notification");
    } else {
      logWithTimestamp("[Connection Initializer] Socket not open, could not send ready message", "warn");
    }
  } catch (error) {
    logWithTimestamp("[Connection Initializer] Error in connection setup: " + (error instanceof Error ? error.message : String(error)), "error");
    
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
