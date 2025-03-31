
/**
 * Utility functions for establishing and managing WebSocket connections
 */

import { OpenAISocketOptions } from "../types.ts";
import { setupOpenAISocketHandlers } from "./socket-handlers.ts";

/**
 * Connect to the OpenAI Realtime API and set up event handlers
 */
export function connectToOpenAI(options: OpenAISocketOptions): void {
  const { 
    socket, 
    apiKey,
    openAISocketRef,
    reconnectTimeoutRef,
    connectionAttemptsRef,
    maxConnectionAttempts
  } = options;

  try {
    console.log(`Connecting to OpenAI Realtime API (attempt ${connectionAttemptsRef.current + 1}/${maxConnectionAttempts})...`);
    console.log("API Key length check:", apiKey ? `Valid (${apiKey.length} characters)` : "Missing");
    
    // Initialize OpenAI WebSocket
    try {
      console.log("Creating OpenAI WebSocket connection to wss://api.openai.com/v1/realtime");
      const openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01");
      openAISocketRef.current = openAISocket;
      console.log("OpenAI WebSocket instance created successfully");
      
      // Set up event handlers
      setupOpenAISocketHandlers({
        socket,
        apiKey,
        openAISocket,
        reconnectTimeoutRef,
        connectionAttemptsRef,
        maxConnectionAttempts,
        retryConnect: () => connectToOpenAI(options)
      });
      console.log("OpenAI socket handlers set up successfully");
    } catch (socketError) {
      console.error("Failed to create OpenAI WebSocket:", socketError);
      console.error("Socket creation error details:", JSON.stringify({
        name: socketError.name,
        message: socketError.message,
        stack: socketError.stack,
        type: typeof socketError
      }));
      
      // Notify client of failure
      try {
        socket.send(JSON.stringify({
          type: "error",
          error: "Failed to create connection to OpenAI",
          details: socketError instanceof Error ? socketError.message : String(socketError),
          time: new Date().toISOString()
        }));
      } catch (sendError) {
        console.error("Failed to send error notification to client:", sendError);
      }
      
      // Handle reconnection
      handleReconnection(options);
    }
  } catch (error) {
    console.error("Error in connectToOpenAI function:", error);
    console.error("Error details:", JSON.stringify({
      name: error.name,
      message: error.message,
      stack: error.stack
    }));
    
    // Notify client of unexpected error
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: "error",
          error: "Unexpected error occurred during connection setup",
          details: error instanceof Error ? error.message : String(error),
          time: new Date().toISOString()
        }));
      }
    } catch (sendError) {
      console.error("Failed to send error notification to client:", sendError);
    }
    
    // Try to reconnect despite the error
    handleReconnection(options);
  }
}

/**
 * Handle reconnection logic for the WebSocket
 */
export function handleReconnection(options: OpenAISocketOptions): void {
  const {
    reconnectTimeoutRef,
    connectionAttemptsRef,
    maxConnectionAttempts,
    socket
  } = options;

  connectionAttemptsRef.current += 1;
  
  if (connectionAttemptsRef.current < maxConnectionAttempts) {
    console.log(`Scheduling reconnection attempt ${connectionAttemptsRef.current + 1}/${maxConnectionAttempts}...`);
    
    // Clear any existing timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // Set exponential backoff: 1s, 2s, 4s, etc.
    const backoffTime = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current - 1), 10000);
    console.log(`Will attempt reconnect in ${backoffTime}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      console.log("Attempting reconnection now...");
      options.retryConnect();
    }, backoffTime);
    
    // Notify client of reconnection attempt
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: "reconnecting",
          attempts: connectionAttemptsRef.current,
          maxAttempts: maxConnectionAttempts,
          nextAttemptIn: backoffTime,
          time: new Date().toISOString()
        }));
      }
    } catch (sendError) {
      console.error("Failed to send reconnection notification to client:", sendError);
    }
  } else {
    console.error(`Maximum reconnection attempts (${maxConnectionAttempts}) reached. Giving up.`);
    
    // Notify client that we've given up trying to reconnect
    try {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({
          type: "error",
          error: "Maximum reconnection attempts reached",
          details: `Failed to connect after ${maxConnectionAttempts} attempts.`,
          time: new Date().toISOString()
        }));
      }
    } catch (sendError) {
      console.error("Failed to send max attempts notification to client:", sendError);
    }
  }
}
