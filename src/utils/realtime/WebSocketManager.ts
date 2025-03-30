
import { SessionConfig, WebSocketMessageEvent } from './types';
import { ReconnectionHandler } from './ReconnectionHandler';
import { ConnectionState } from './ConnectionState';

/**
 * Manages WebSocket connections to the realtime chat service
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private projectId: string;
  private connectionState: ConnectionState;
  private reconnectionHandler: ReconnectionHandler;
  private connectionTimeout: number = 15000; // 15 second timeout
  
  constructor(projectId: string) {
    this.projectId = projectId;
    this.connectionState = new ConnectionState();
    this.reconnectionHandler = new ReconnectionHandler(() => this.connect());
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.connectionState.isConnected();
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    try {
      this.reconnectionHandler.clearTimeout();
      
      // Close any existing connection first
      if (this.websocket) {
        try {
          this.websocket.close(1000, "Reconnecting");
        } catch (err) {
          console.warn("Error closing existing WebSocket:", err);
        }
        this.websocket = null;
      }
      
      // Use direct URL with HTTPS protocol to ensure proper connection
      const wsUrl = `wss://${this.projectId}.functions.supabase.co/realtime-chat`;
      console.log("Connecting to WebSocket:", wsUrl);
      
      this.websocket = new WebSocket(wsUrl);
      
      return new Promise<void>((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error("Failed to create WebSocket"));
          return;
        }
        
        const timeoutId = setTimeout(() => {
          if (!this.connectionState.isConnected()) {
            console.error("WebSocket connection timeout");
            if (this.websocket) {
              try {
                this.websocket.close();
              } catch (err) {
                console.warn("Error closing WebSocket after timeout:", err);
              }
            }
            reject(new Error("Connection timeout"));
            this.reconnectionHandler.tryReconnect();
          }
        }, this.connectionTimeout);
        
        this.websocket.onopen = () => {
          console.log("WebSocket connection established");
          this.connectionState.setConnected(true);
          this.reconnectionHandler.resetAttempts();
          clearTimeout(timeoutId);
          resolve();
        };
        
        this.websocket.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          this.connectionState.setConnected(false);
          clearTimeout(timeoutId);
          reject(error);
          this.reconnectionHandler.tryReconnect();
        };
        
        this.websocket.onclose = (event) => {
          console.log("WebSocket connection closed:", event.code, event.reason);
          this.connectionState.setConnected(false);
          clearTimeout(timeoutId);
          
          // Don't reconnect if it was a normal closure
          if (event.code !== 1000) {
            this.reconnectionHandler.tryReconnect();
          }
        };
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      this.connectionState.setConnected(false);
      this.reconnectionHandler.tryReconnect();
      throw error;
    }
  }
  
  /**
   * Configure the session settings
   */
  configureSession(sessionConfig: SessionConfig): boolean {
    if (!this.checkConnection()) {
      console.error("Cannot configure session: WebSocket not connected");
      return false;
    }
    
    try {
      console.log("Configuring session...");
      this.websocket!.send(JSON.stringify(sessionConfig));
      return true;
    } catch (error) {
      console.error("Failed to configure session:", error);
      this.reconnectionHandler.tryReconnect();
      return false;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    if (!this.checkConnection()) {
      console.error("WebSocket not connected");
      return false;
    }
    
    try {
      this.websocket!.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      this.reconnectionHandler.tryReconnect();
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
    this.reconnectionHandler.clearTimeout();
    
    if (this.websocket) {
      try {
        this.websocket.close(1000, "Client disconnected normally");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      this.websocket = null;
    }
    this.connectionState.setConnected(false);
    this.reconnectionHandler.resetAttempts();
  }
  
  /**
   * Check if WebSocket is currently connected
   */
  checkConnection(): boolean {
    return this.connectionState.checkConnection(this.websocket);
  }
}
