
import { PromiseManager } from './PromiseManager';
import { TimeoutManager } from './TimeoutManager';

/**
 * Manager for handling WebSocket connections
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private promiseManager: PromiseManager = new PromiseManager();
  private timeoutManager: TimeoutManager = new TimeoutManager();

  /**
   * Create a WebSocket connection to the specified URL
   */
  async connect(wsUrl: string, setupEventHandlers: (websocket: WebSocket, timeoutId: number) => void): Promise<void> {
    try {
      // Don't attempt multiple connections simultaneously
      const connectionPromise = this.promiseManager.createPromise();
      
      // Close any existing connection first
      if (this.websocket) {
        try {
          this.websocket.close(1000, "Reconnecting");
        } catch (err) {
          console.warn("Error closing existing WebSocket:", err);
        }
        this.websocket = null;
      }
      
      try {
        console.log("Connecting to WebSocket:", wsUrl);
        
        this.websocket = new WebSocket(wsUrl);
        this.websocket.binaryType = "arraybuffer";
        
        // Create a timeout for connection attempt
        const timeoutId = this.timeoutManager.createTimeout(() => {
          if (this.websocket?.readyState !== WebSocket.OPEN) {
            console.error("WebSocket connection timeout after", this.timeoutManager.getConnectionTimeout(), "ms");
            if (this.websocket) {
              try {
                this.websocket.close();
              } catch (err) {
                console.warn("Error closing WebSocket after timeout:", err);
              }
            }
            
            this.promiseManager.rejectPromise(new Error("Connection timeout"));
          }
        });
        
        setupEventHandlers(this.websocket, timeoutId);
        
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        this.promiseManager.rejectPromise(error);
        throw error;
      }
      
      return connectionPromise;
    } catch (error) {
      console.error("Failed to connect:", error);
      throw error;
    }
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
    
    this.promiseManager.resetPromise();
  }
  
  /**
   * Get the WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.websocket;
  }

  /**
   * Resolve the connection promise
   */
  resolveOpenPromise(): void {
    this.promiseManager.resolvePromise();
  }

  /**
   * Reject the connection promise
   */
  rejectOpenPromise(error: any): void {
    this.promiseManager.rejectPromise(error);
  }

  /**
   * Set the connection timeout
   */
  setConnectionTimeout(timeout: number): void {
    this.timeoutManager.setConnectionTimeout(timeout);
  }
}
