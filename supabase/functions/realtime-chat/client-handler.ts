import { ConnectionHandlerOptions } from "./types.ts";

/**
 * Setup event handlers for client WebSocket connection
 */
export function setupClientConnectionHandlers(options: ConnectionHandlerOptions): void {
  const { 
    socket, 
    openAISocketRef,
    reconnectTimeoutRef,
    connectionAttemptsRef
  } = options;

  // Add ping/pong handling for connection keep-alive
  let lastPingTime = Date.now();
  let pingInterval: number | null = null;
  
  // Start sending pings to client every 30 seconds
  pingInterval = setInterval(() => {
    try {
      if (socket.readyState === socket.OPEN) {
        console.log("Sending ping to client");
        socket.send(JSON.stringify({
          type: "ping",
          timestamp: new Date().toISOString()
        }));
        lastPingTime = Date.now();
      } else {
        console.log(`Cannot send ping: socket state is ${socket.readyState}`);
        if (pingInterval) {
          clearInterval(pingInterval);
          pingInterval = null;
        }
      }
    } catch (error) {
      console.error("Error sending ping:", error);
    }
  }, 30000);

  // Handle socket closures
  socket.onclose = (event) => {
    console.log(`Client disconnected. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
    
    // Log additional details about the close event
    console.log("Close event details:", JSON.stringify({
      wasClean: event.wasClean,
      code: event.code,
      reason: event.reason || "No reason provided"
    }));
    
    // Clear ping interval
    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
      console.log("Cleared ping interval");
    }
    
    // Clear any pending reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      console.log("Cleared pending reconnection timeout");
    }
    
    if (openAISocketRef.current) {
      try {
        console.log("Closing OpenAI socket due to client disconnection");
        openAISocketRef.current.close();
      } catch (closeError) {
        console.error("Error while closing OpenAI socket:", closeError);
      } finally {
        openAISocketRef.current = null;
        console.log("OpenAI socket reference cleared");
      }
    }
  };
  
  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    
    // Try to extract more error details if possible
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack } 
      : { message: "Unknown WebSocket error" };
    
    console.error("Error details:", JSON.stringify(errorDetails));
    
    // Notify client of the error
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: "error",
          error: "WebSocket error occurred",
          details: errorDetails.message,
          time: new Date().toISOString()
        }));
        console.log("Error notification sent to client");
      } else {
        console.warn(`Cannot send error to client: Socket state is ${socket.readyState}`);
      }
    } catch (sendError) {
      console.error("Error sending error notification to client:", sendError);
    }
  };
  
  // Add a message handler that logs all incoming messages and handles pings
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received message from client:", data.type || "unknown type");
      
      // Handle ping messages by sending pong responses
      if (data.type === "ping") {
        try {
          if (socket.readyState === socket.OPEN) {
            socket.send(JSON.stringify({
              type: "pong",
              timestamp: new Date().toISOString(),
              echo: data.timestamp
            }));
            console.log("Sent pong response");
          }
        } catch (pongError) {
          console.error("Error sending pong:", pongError);
        }
        return; // Don't forward ping messages to message handler
      }
      
      // We're just logging here - the actual message handling will be set up elsewhere
    } catch (parseError) {
      console.error("Failed to parse message from client:", parseError);
      console.error("Raw message data:", event.data);
      
      try {
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({
            type: "error",
            error: "Failed to parse message",
            details: parseError instanceof Error ? parseError.message : String(parseError),
            time: new Date().toISOString()
          }));
        }
      } catch (sendError) {
        console.error("Failed to send error notification to client:", sendError);
      }
    }
  };
}
