
// Types for WebSocket handler
import { corsHeaders } from "./utils.ts";

// Configuration options for the WebSocket handler
export interface WebSocketOptions {
  reconnectAttempts?: number;
  connectionTimeout?: number;
}

// Default configuration
export const defaultOptions: WebSocketOptions = {
  reconnectAttempts: 3,
  connectionTimeout: 30000, // 30 seconds
};

// Define references for mutable variables
export interface MutableRef<T> {
  current: T;
}

export interface ConnectionHandlerOptions {
  socket: WebSocket;
  openAISocketRef: MutableRef<WebSocket | null>;
  reconnectTimeoutRef: MutableRef<number | undefined>;
  connectionAttemptsRef: MutableRef<number>;
  maxConnectionAttempts: number;
}

export interface OpenAISocketOptions extends ConnectionHandlerOptions {
  apiKey: string;
  openAISocket: WebSocket;
  retryConnect: () => void;
}

// Response helper functions
export function createErrorResponse(error: unknown, status = 500): Response {
  console.error("WebSocket error:", error);
  return new Response(JSON.stringify({ 
    error: error instanceof Error ? error.message : String(error) 
  }), { 
    status, 
    headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
  });
}
