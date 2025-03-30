
/**
 * Main handler for OpenAI Realtime API connections
 */

import { OpenAISocketOptions, ConnectionHandlerOptions } from "./types.ts";
import { connectToOpenAI } from "./utils/connection-utils.ts";
import { setupOpenAISocketHandlers, setupClientMessageHandler } from "./utils/socket-handlers.ts";

// Re-export utility functions for use elsewhere
export { connectToOpenAI } from "./utils/connection-utils.ts";
export { setupOpenAISocketHandlers, setupClientMessageHandler } from "./utils/socket-handlers.ts";

/**
 * Set up WebSocket connection and handlers for OpenAI Realtime API
 * 
 * This function serves as the main entry point for establishing and managing
 * the connection between the client and OpenAI's Realtime API service.
 */
export function setupOpenAIConnection(options: ConnectionHandlerOptions & { apiKey: string }): void {
  const { 
    socket, 
    apiKey,
    openAISocketRef,
    reconnectTimeoutRef,
    connectionAttemptsRef,
    maxConnectionAttempts
  } = options;

  // Set up the client message handler
  setupClientMessageHandler(
    socket, 
    openAISocketRef, 
    reconnectTimeoutRef, 
    connectionAttemptsRef, 
    maxConnectionAttempts, 
    () => connectToOpenAI(options)
  );

  // Connect to OpenAI's Realtime API
  connectToOpenAI(options);
}
