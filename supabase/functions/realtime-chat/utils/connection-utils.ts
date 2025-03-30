
/**
 * Utility functions for connecting to OpenAI's Realtime API
 */

import { OpenAISocketOptions, ConnectionHandlerOptions } from "../types.ts";
import { setupOpenAISocketHandlers } from "./socket-handlers.ts";

/**
 * Connect to OpenAI's Realtime API with retry logic
 */
export function connectToOpenAI(options: ConnectionHandlerOptions & { apiKey: string }): void {
  const { 
    socket, 
    apiKey,
    openAISocketRef,
    reconnectTimeoutRef,
    connectionAttemptsRef,
    maxConnectionAttempts
  } = options;
  
  try {
    if (openAISocketRef.current) {
      try {
        openAISocketRef.current.close();
      } catch (err) {
        console.warn("Error closing existing OpenAI WebSocket:", err);
      }
    }
    
    // Connect to the correct OpenAI Realtime API endpoint with gpt-4o
    console.log("Connecting to OpenAI Realtime API with model: gpt-4o-realtime-preview-2024-10-01");
    
    // Make sure we're using the correct URL
    openAISocketRef.current = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
    
    // Send confirmation to client
    socket.send(JSON.stringify({ 
      type: "info", 
      message: "Establishing connection to OpenAI Realtime API" 
    }));
    
    setupOpenAISocketHandlers({
      socket,
      apiKey,
      openAISocket: openAISocketRef.current,
      reconnectTimeoutRef,
      connectionAttemptsRef,
      maxConnectionAttempts,
      retryConnect: () => connectToOpenAI(options),
    });
  } catch (error) {
    console.error("Error connecting to OpenAI:", error);
    socket.send(JSON.stringify({ 
      type: "error", 
      error: "Failed to connect to OpenAI: " + (error instanceof Error ? error.message : String(error)) 
    }));
  }
}

/**
 * Handle reconnection attempts with exponential backoff
 */
export function handleReconnection(options: OpenAISocketOptions): void {
  const { 
    connectionAttemptsRef, 
    maxConnectionAttempts, 
    reconnectTimeoutRef,
    socket,
    retryConnect
  } = options;
  
  if (connectionAttemptsRef.current < maxConnectionAttempts) {
    connectionAttemptsRef.current++;
    const backoffTime = 1000 * Math.pow(2, connectionAttemptsRef.current);
    console.log(`Retrying OpenAI connection in ${backoffTime/1000}s, attempt ${connectionAttemptsRef.current} of ${maxConnectionAttempts}`);
    
    // Use proper type for setTimeout with Deno
    reconnectTimeoutRef.current = setTimeout(retryConnect, backoffTime);
    
    // Notify client of reconnection attempt
    socket.send(JSON.stringify({ 
      type: "warning", 
      message: `Connection lost, attempting to reconnect (${connectionAttemptsRef.current}/${maxConnectionAttempts})...` 
    }));
  } else {
    socket.send(JSON.stringify({ 
      type: "error", 
      error: "Failed to connect to OpenAI API after multiple attempts" 
    }));
  }
}
