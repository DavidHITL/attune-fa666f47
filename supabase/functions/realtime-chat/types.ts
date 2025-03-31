
/**
 * Options for WebSocket handler configuration
 */
export interface WebSocketOptions {
  /** Maximum message size in bytes */
  maxMessageSize?: number;
  /** Timeout for inactive connections in milliseconds */
  connectionTimeout?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
}

/**
 * Default WebSocket handler options
 */
export const defaultOptions: WebSocketOptions = {
  maxMessageSize: 1024 * 1024, // 1MB
  connectionTimeout: 300000, // 5 minutes
  debug: true
};
