
/**
 * Manages WebSocket connections
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  public messageHandler: ((event: MessageEvent) => void) | null = null;
  public wsUrl: string | null = null;
  
  /**
   * Set the WebSocket URL
   */
  setUrl(url: string): void {
    console.log("[WebSocketManager] Setting URL:", url);
    this.wsUrl = url;
  }
  
  /**
   * Get the WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.websocket;
  }
  
  /**
   * Connect to the WebSocket server
   */
  async connect(setupHandlers: (websocket: WebSocket, timeoutId: number) => void): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!this.wsUrl) {
          const error = new Error("WebSocket URL not set");
          console.error("[WebSocketManager] Connection error:", error);
          reject(error);
          return;
        }
        
        // Close any existing connection
        if (this.websocket) {
          try {
            console.log("[WebSocketManager] Closing existing connection");
            this.websocket.close();
          } catch (error) {
            console.warn("[WebSocketManager] Error closing existing WebSocket:", error);
          }
          this.websocket = null;
        }
        
        // Create a new WebSocket connection
        console.log("[WebSocketManager] Connecting to WebSocket:", this.wsUrl);
        this.websocket = new WebSocket(this.wsUrl);
        
        // Set up binary type for audio data
        this.websocket.binaryType = "arraybuffer";
        
        // Set up a timeout for connection
        const timeoutId = window.setTimeout(() => {
          if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
            console.error("[WebSocketManager] WebSocket connection timed out");
            if (this.websocket) {
              try {
                this.websocket.close();
              } catch (err) {
                // Ignore
              }
            }
            reject(new Error("Connection timeout"));
          }
        }, 10000); // 10 seconds timeout
        
        // Set up handlers
        setupHandlers(this.websocket, timeoutId);
        
        // Original onopen handler in the promise
        this.websocket.addEventListener('open', () => {
          console.log("[WebSocketManager] WebSocket opened in connect promise");
          window.clearTimeout(timeoutId);
          resolve();
        });
        
        // Original onerror handler in the promise
        this.websocket.addEventListener('error', (event) => {
          console.error("[WebSocketManager] WebSocket error in connect promise:", event);
          window.clearTimeout(timeoutId);
          reject(event);
        });
      } catch (error) {
        console.error("[WebSocketManager] Error creating WebSocket:", error);
        reject(error);
      }
    });
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    if (this.websocket) {
      try {
        console.log("[WebSocketManager] Disconnecting WebSocket");
        this.websocket.close();
      } catch (error) {
        console.error("[WebSocketManager] Error closing WebSocket:", error);
      }
      this.websocket = null;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error("[WebSocketManager] WebSocket is not connected, state:", 
                  this.websocket ? this.websocket.readyState : "null");
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      console.log("[WebSocketManager] Sending message:", message.type || "unknown type");
      this.websocket.send(messageStr);
      return true;
    } catch (error) {
      console.error("[WebSocketManager] Error sending WebSocket message:", error);
      return false;
    }
  }

  /**
   * Set up a handler for WebSocket messages
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    console.log("[WebSocketManager] Setting message handler");
    this.messageHandler = handler;
    
    if (this.websocket) {
      this.websocket.onmessage = this.messageHandler;
    }
  }
  
  /**
   * Check if WebSocket is currently connected
   */
  checkConnection(): boolean {
    const isConnected = !!this.websocket && this.websocket.readyState === WebSocket.OPEN;
    console.log("[WebSocketManager] Connection check:", isConnected, 
               "WebSocket state:", this.websocket ? this.websocket.readyState : "null");
    return isConnected;
  }
}
