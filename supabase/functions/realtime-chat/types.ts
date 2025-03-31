
// Types for the realtime-chat edge function

export type MutableRef<T> = { current: T };

export interface WebSocketOptions {
  reconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
}

export const defaultOptions: WebSocketOptions = {
  reconnectAttempts: 3,
  reconnectDelay: 2000,
  debug: false
};

export interface OpenAISocketOptions {
  socket: WebSocket;
  apiKey: string;
  openAISocket: WebSocket;
  reconnectTimeoutRef: MutableRef<number | undefined>;
  connectionAttemptsRef: MutableRef<number>;
  maxConnectionAttempts: number;
  retryConnect: () => void;
}

export interface ConnectionHandlerOptions {
  socket: WebSocket;
  openAISocketRef: MutableRef<WebSocket | null>;
  reconnectTimeoutRef: MutableRef<number | undefined>;
  connectionAttemptsRef: MutableRef<number>;
  maxConnectionAttempts: number;
}
