
// Handler for setting up OpenAI connection

import { connectToOpenAI } from "./utils/connection-utils.ts";
import { setupClientMessageHandler } from "./utils/socket-handlers.ts";
import { ConnectionHandlerOptions } from "./types.ts";

/**
 * Set up OpenAI connection and message handlers
 */
export function setupOpenAIConnection(options: ConnectionHandlerOptions): void {
  const { 
    socket, 
    apiKey,
    openAISocketRef,
    reconnectTimeoutRef,
    connectionAttemptsRef,
    maxConnectionAttempts
  } = options;

  try {
    console.log('Setting up OpenAI connection with API key length:', apiKey.length);
    
    // Connect to OpenAI
    connectToOpenAI({
      socket, 
      apiKey,
      openAISocket: null!, // Will be set during connection
      openAISocketRef,
      reconnectTimeoutRef,
      connectionAttemptsRef,
      maxConnectionAttempts,
      retryConnect: () => connectToOpenAI({
        socket, 
        apiKey,
        openAISocket: null!,
        openAISocketRef,
        reconnectTimeoutRef,
        connectionAttemptsRef,
        maxConnectionAttempts,
        retryConnect: () => {} // Simplified for nested call
      })
    });
    
    // Set up message handler from client to OpenAI
    setupClientMessageHandler(
      socket, 
      openAISocketRef, 
      reconnectTimeoutRef,
      connectionAttemptsRef,
      maxConnectionAttempts,
      () => connectToOpenAI({
        socket, 
        apiKey,
        openAISocket: null!,
        openAISocketRef,
        reconnectTimeoutRef,
        connectionAttemptsRef,
        maxConnectionAttempts,
        retryConnect: () => {} // Simplified for nested call
      })
    );
  } catch (error) {
    console.error("Error setting up OpenAI connection:", error);
    
    // Notify client of the error
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: "error", 
          error: "Failed to setup OpenAI connection",
          details: error instanceof Error ? error.message : String(error),
          time: new Date().toISOString()
        }));
      }
    } catch (sendError) {
      console.error("Error sending error notification to client:", sendError);
    }
    
    throw error;
  }
}
