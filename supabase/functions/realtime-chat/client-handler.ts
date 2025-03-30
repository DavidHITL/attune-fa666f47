
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
  socket.onclose = () => {
    console.log("Client disconnected");
    // Clear any pending reconnect timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (openAISocketRef.current) {
      openAISocketRef.current.close();
      openAISocketRef.current = null;
    }
  };
  
  socket.onerror = (error) => {
    console.error("Client WebSocket error:", error);
    // Notify client of the error
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: "error",
          error: "WebSocket error occurred",
          details: error instanceof Error ? error.message : "Unknown error"
        }));
      }
    } catch (sendError) {
      console.error("Error sending error notification to client:", sendError);
    }
  };
}
