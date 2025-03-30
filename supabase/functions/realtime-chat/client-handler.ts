
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

  // Handle socket closures
  socket.onclose = (event) => {
    console.log(`Client disconnected. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
    
    // Log additional details about the close event
    console.log("Close event details:", JSON.stringify({
      wasClean: event.wasClean,
      code: event.code,
      reason: event.reason || "No reason provided"
    }));
    
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
  
  // Add a message handler that logs all incoming messages
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("Received message from client:", data.type || "unknown type");
      
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
