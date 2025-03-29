
import { SessionConfig, WebSocketMessageEvent } from './types';

/**
 * Manages WebSocket connections to the realtime chat service
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private projectId: string;
  public isConnected: boolean = false;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    try {
      const wsUrl = `wss://${this.projectId}.functions.supabase.co/realtime-chat`;
      console.log("Connecting to WebSocket:", wsUrl);
      
      this.websocket = new WebSocket(wsUrl);
      
      return new Promise<void>((resolve, reject) => {
        if (!this.websocket) {
          reject(new Error("Failed to create WebSocket"));
          return;
        }
        
        this.websocket.onopen = () => {
          console.log("WebSocket connection established");
          this.isConnected = true;
          resolve();
        };
        
        this.websocket.onerror = (error) => {
          console.error("WebSocket connection error:", error);
          this.isConnected = false;
          reject(error);
        };
        
        this.websocket.onclose = (event) => {
          console.log("WebSocket connection closed:", event.code, event.reason);
          this.isConnected = false;
        };
      });
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Configure the session settings
   */
  configureSession(sessionConfig: SessionConfig): void {
    if (!this.websocket || !this.isConnected) return;
    
    console.log("Configuring session...");
    this.websocket.send(JSON.stringify(sessionConfig));
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): void {
    if (!this.websocket || !this.isConnected) {
      console.error("WebSocket not connected");
      return;
    }
    
    this.websocket.send(JSON.stringify(message));
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
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    this.isConnected = false;
  }
}
