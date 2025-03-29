
import { SessionConfig, WebSocketMessageEvent } from './types';

/**
 * Manages WebSocket connections to the realtime chat service
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private projectId: string;
  public isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 3;
  private reconnectTimeout: number | null = null;
  
  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    try {
      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }
      
      const wsUrl = `wss://${this.projectId}.functions.supabase.co/realtime-chat`;
      console.log("Connecting to WebSocket:", wsUrl);
      
      this.websocket = new WebSocket(wsUrl);
      
      return new Promise<void>((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error("Failed to create WebSocket"));
          return;
        }
        
        const timeout = setTimeout(() => {
          if (!this.isConnected) {
            console.error("WebSocket connection timeout");
            reject(new Error("Connection timeout"));
            this.tryReconnect();
          }
        }, 10000); // 10 second timeout
        
        this.websocket.onopen = () => {
          console.log("WebSocket connection established");
          this.isConnected = true;
          this.reconnectAttempts = 0;
          clearTimeout(timeout);
          resolve();
        };
        
        this.websocket.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          this.isConnected = false;
          clearTimeout(timeout);
          reject(error);
          this.tryReconnect();
        };
        
        this.websocket.onclose = (event) => {
          console.log("WebSocket connection closed:", event.code, event.reason);
          this.isConnected = false;
          clearTimeout(timeout);
          
          // Don't reconnect if it was a normal closure
          if (event.code !== 1000) {
            this.tryReconnect();
          }
        };
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      this.tryReconnect();
      throw error;
    }
  }
  
  /**
   * Try to reconnect to the WebSocket server with exponential backoff
   */
  private tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Maximum reconnection attempts reached");
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
    
    this.reconnectAttempts++;
    this.reconnectTimeout = window.setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      this.connect().catch(err => console.error("Reconnection failed:", err));
    }, delay);
  }

  /**
   * Configure the session settings
   */
  configureSession(sessionConfig: SessionConfig): void {
    if (!this.websocket || !this.isConnected) {
      console.error("Cannot configure session: WebSocket not connected");
      return;
    }
    
    try {
      console.log("Configuring session...");
      this.websocket.send(JSON.stringify(sessionConfig));
    } catch (error) {
      console.error("Failed to configure session:", error);
      this.tryReconnect();
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    if (!this.websocket || !this.isConnected) {
      console.error("WebSocket not connected");
      return false;
    }
    
    try {
      this.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      this.tryReconnect();
      return false;
    }
  }

  /**
   * Set up message handler for WebSocket events
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    if (!this.websocket) return;
    this.websocket.onmessage = handler;
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.websocket) {
      try {
        this.websocket.close(1000, "Client disconnected normally");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      this.websocket = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }
  
  /**
   * Check if WebSocket is currently connected
   */
  checkConnection(): boolean {
    return this.isConnected && !!this.websocket && this.websocket.readyState === WebSocket.OPEN;
  }
}
