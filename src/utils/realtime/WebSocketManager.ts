
import { SessionConfig } from './types';

/**
 * Manages WebSocket connections to the realtime chat service
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;
  private wsUrl: string | null = null;
  
  /**
   * Set the WebSocket URL
   */
  setUrl(url: string): void {
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
          throw new Error("WebSocket URL not set");
        }
        
        // Close any existing connection
        if (this.websocket) {
          try {
            this.websocket.close();
          } catch (error) {
            console.warn("Error closing existing WebSocket:", error);
          }
          this.websocket = null;
        }
        
        // Create a new WebSocket connection
        console.log("Connecting to WebSocket:", this.wsUrl);
        this.websocket = new WebSocket(this.wsUrl);
        
        // Set up binary type for audio data
        this.websocket.binaryType = "arraybuffer";
        
        // Set up a timeout for connection
        const timeoutId = window.setTimeout(() => {
          if (this.websocket && this.websocket.readyState !== WebSocket.OPEN) {
            console.error("WebSocket connection timed out");
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
          console.log("WebSocket opened in connect promise");
          window.clearTimeout(timeoutId);
          resolve();
        });
        
        // Original onerror handler in the promise
        this.websocket.addEventListener('error', (event) => {
          console.error("WebSocket error in connect promise:", event);
          window.clearTimeout(timeoutId);
          reject(event);
        });
      } catch (error) {
        console.error("Error creating WebSocket:", error);
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
        this.websocket.close();
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      this.websocket = null;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket is not connected");
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.websocket.send(messageStr);
      return true;
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      return false;
    }
  }

  /**
   * Set up a handler for WebSocket messages
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    this.messageHandler = handler;
    
    if (this.websocket) {
      this.websocket.onmessage = this.messageHandler;
    }
  }
  
  /**
   * Check if WebSocket is currently connected
   */
  checkConnection(): boolean {
    return !!this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }
}
