import { getOpenAIApiKey } from "../utils.ts";
import { setupClientConnectionHandlers } from "../client-handler.ts";
import { setupOpenAIConnection } from "../openai-handler.ts";
import { ConnectionHandlerOptions } from "../types.ts";

/**
 * Initialize and set up all connections after WebSocket is established
 */
export function initializeConnections(socket: WebSocket): void {
  try {
    // Send immediate confirmation to client
    try {
      socket.send(JSON.stringify({ 
        type: "connection.established", 
        message: "WebSocket connection established",
        protocol: socket.protocol || "none",
        time: new Date().toISOString() 
      }));
      console.log("[Connection Initializer] Sent connection confirmation");
    } catch (sendError) {
      console.error("[Connection Initializer] Error sending confirmation:", sendError);
    }
    
    // Set up ping interval for keep-alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({
            type: "ping",
            timestamp: new Date().toISOString()
          }));
          console.log("[Connection Initializer] Sent keep-alive ping");
        } catch (pingError) {
          console.error("[Connection Initializer] Error sending ping:", pingError);
          clearInterval(pingInterval);
        }
      } else {
        console.log("[Connection Initializer] Stopping pings, socket state:", socket.readyState);
        clearInterval(pingInterval);
      }
    }, 30000);
    
    // Set up OpenAI connection with improved error handling
    setupOpenAIConnectionWithErrorHandling(socket, pingInterval);
  } catch (error) {
    console.error("[Connection Initializer] Error during initialization:", error);
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: "error", 
          error: "Error during connection initialization",
          details: error instanceof Error ? error.message : String(error),
          time: new Date().toISOString()
        }));
      }
    } catch (e) {
      console.error("[Connection Initializer] Failed to send error message:", e);
    }
  }
}

/**
 * Set up OpenAI connection with error handling
 */
function setupOpenAIConnectionWithErrorHandling(socket: WebSocket, pingInterval: number): void {
  try {
    const OPENAI_API_KEY = getOpenAIApiKey();
    
    let openAISocket: WebSocket | null = null;
    let connectionAttempts = 0;
    const maxConnectionAttempts = 3; // Default value
    let reconnectTimeout: number | undefined;

    // Reference objects for passing by reference
    const openAISocketRef = { current: openAISocket };
    const reconnectTimeoutRef = { current: reconnectTimeout };
    const connectionAttemptsRef = { current: connectionAttempts };
    
    const handlerOptions: ConnectionHandlerOptions = {
      socket, 
      apiKey: OPENAI_API_KEY,
      openAISocketRef,
      reconnectTimeoutRef,
      connectionAttemptsRef,
      maxConnectionAttempts
    };
    
    // Set up client message handlers
    setupClientConnectionHandlers(handlerOptions);
    
    // Connect to OpenAI
    setupOpenAIConnection(handlerOptions);
    
    // Clean up resources on close
    const originalOnClose = socket.onclose;
    socket.onclose = (event) => {
      clearInterval(pingInterval);
      console.log("[Connection Initializer] Cleared ping interval due to socket close");
      
      if (originalOnClose) {
        originalOnClose.call(socket, event);
      }
    };
  } catch (setupError) {
    console.error("[Connection Initializer] Error during OpenAI setup:", setupError);
    try {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ 
          type: "error", 
          error: "Error setting up OpenAI connection",
          details: setupError instanceof Error ? setupError.message : String(setupError),
          time: new Date().toISOString()
        }));
      }
    } catch (notifyError) {
      console.error("[Connection Initializer] Failed to notify client of setup error:", notifyError);
    }
    throw setupError;
  }
}
