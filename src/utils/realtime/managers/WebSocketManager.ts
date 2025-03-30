
/**
 * Manages WebSocket connections
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;

  /**
   * Connect to a WebSocket endpoint
   */
  async connect(
    url: string,
    setupHandlers: (websocket: WebSocket, timeoutId: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log("[Managers/WebSocketManager] Connecting to:", url);
        
        // Close existing connection if any
        if (this.websocket) {
          try {
            console.log("[Managers/WebSocketManager] Closing existing connection");
            this.websocket.close();
          } catch (error) {
            console.warn("[Managers/WebSocketManager] Error closing existing WebSocket:", error);
          }
        }
        
        // Create new connection
        this.websocket = new WebSocket(url);
        
        // Set binary type for audio data
        this.websocket.binaryType = "arraybuffer";
        
        // Set connection timeout
        const timeoutId = window.setTimeout(() => {
          console.error("[Managers/WebSocketManager] Connection timed out");
          reject(new Error("Connection timeout"));
          this.websocket?.close();
        }, 10000);
        
        // Configure handlers
        setupHandlers(this.websocket, timeoutId);
        
        // Handle successful connection
        this.websocket.addEventListener('open', () => {
          console.log("[Managers/WebSocketManager] Connection established");
          window.clearTimeout(timeoutId);
          resolve();
        });
        
        // Handle connection errors
        this.websocket.addEventListener('error', (event) => {
          console.error("[Managers/WebSocketManager] Connection error:", event);
          window.clearTimeout(timeoutId);
          reject(event);
        });
      } catch (error) {
        console.error("[Managers/WebSocketManager] Error setting up connection:", error);
        reject(error);
      }
    });
  }
  
  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    console.log("[Managers/WebSocketManager] Disconnecting");
    this.websocket?.close();
    this.websocket = null;
  }
  
  /**
   * Get WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.websocket;
  }

  /**
   * Check if WebSocket is connected
   */
  checkConnection(): boolean {
    const isConnected = !!this.websocket && this.websocket.readyState === WebSocket.OPEN;
    console.log("[Managers/WebSocketManager] Connection check:", isConnected, 
              "WebSocket state:", this.websocket ? this.websocket.readyState : "null");
    return isConnected;
  }
}
