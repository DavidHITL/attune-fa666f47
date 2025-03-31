
/**
 * Common interface for WebSocket managers
 */
export interface IWebSocketManager {
  setUrl(url: string): void;
  setProtocols(protocols: string[]): void;
  setHeartbeatConfig(pingIntervalMs: number, pongTimeoutMs: number, maxMissedHeartbeats: number): void;
  connect(setupHandlers: (websocket: WebSocket, timeoutId: number) => void): Promise<void>;
  startHeartbeat(): void;
  stopHeartbeat(): void;
  handlePong(): void;
  reconnect(): void;
  disconnect(): void;
  getWebSocket(): WebSocket | null;
  checkConnection(): boolean;
  send(message: any): boolean;
  setMessageHandler(handler: (event: MessageEvent) => void): void;
  resolveOpenPromise(): void;
  rejectOpenPromise(reason: any): void;
}
