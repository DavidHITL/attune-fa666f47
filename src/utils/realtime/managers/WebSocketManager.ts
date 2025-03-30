
/**
 * Manager for handling WebSocket connections
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private connectionTimeout: number = 15000; // 15 second timeout
  private openPromise: Promise<void> | null = null;
  private openPromiseResolve: (() => void) | null = null;
  private openPromiseReject: ((reason?: any) => void) | null = null;

  /**
   * Create a WebSocket connection to the specified URL
   */
  async connect(wsUrl: string, setupEventHandlers: (websocket: WebSocket, timeoutId: number) => void): Promise<void> {
    try {
      // Don't attempt multiple connections simultaneously
      if (this.openPromise) {
        console.log("Connection already in progress, returning existing promise");
        return this.openPromise;
      }
      
      // Close any existing connection first
      if (this.websocket) {
        try {
          this.websocket.close(1000, "Reconnecting");
        } catch (err) {
          console.warn("Error closing existing WebSocket:", err);
        }
        this.websocket = null;
      }
      
      // Create a new promise for this connection attempt
      this.openPromise = new Promise<void>((resolve, reject) => {
        this.openPromiseResolve = resolve;
        this.openPromiseReject = reject;
        
        try {
          console.log("Connecting to WebSocket:", wsUrl);
          
          this.websocket = new WebSocket(wsUrl);
          this.websocket.binaryType = "arraybuffer";
          
          // Use window.setTimeout to ensure correct type
          const timeoutId = window.setTimeout(() => {
            if (this.websocket?.readyState !== WebSocket.OPEN) {
              console.error("WebSocket connection timeout after", this.connectionTimeout, "ms");
              if (this.websocket) {
                try {
                  this.websocket.close();
                } catch (err) {
                  console.warn("Error closing WebSocket after timeout:", err);
                }
              }
              
              if (this.openPromiseReject) {
                this.openPromiseReject(new Error("Connection timeout"));
              }
              
              // Reset the promise
              this.resetPromise();
            }
          }, this.connectionTimeout);
          
          setupEventHandlers(this.websocket, timeoutId);
          
        } catch (error) {
          console.error("Error creating WebSocket:", error);
          
          if (this.openPromiseReject) {
            this.openPromiseReject(error);
          }
          
          this.resetPromise();
          throw error;
        }
      });
      
      return this.openPromise;
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }
  }

  /**
   * Reset the connection promise state
   */
  resetPromise(): void {
    this.openPromise = null;
    this.openPromiseResolve = null;
    this.openPromiseReject = null;
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnect(): void {
    if (this.websocket) {
      try {
        this.websocket.close(1000, "Client disconnected normally");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      this.websocket = null;
    }
    
    this.resetPromise();
  }
  
  /**
   * Get the WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.websocket;
  }

  /**
   * Resolve the open promise
   */
  resolveOpenPromise(): void {
    if (this.openPromiseResolve) {
      this.openPromiseResolve();
      this.resetPromise();
    }
  }

  /**
   * Reject the open promise
   */
  rejectOpenPromise(error: any): void {
    if (this.openPromiseReject) {
      this.openPromiseReject(error);
      this.resetPromise();
    }
  }

  /**
   * Set the connection timeout
   */
  setConnectionTimeout(timeout: number): void {
    this.connectionTimeout = timeout;
  }
}
