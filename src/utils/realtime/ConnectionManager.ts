
import { EventEmitter } from './EventEmitter';
import { WebSocketManager } from './WebSocketManager';
import { ChatError, ErrorType } from './types';

/**
 * Manages connection to the voice chat service
 */
export class ConnectionManager {
  private websocketManager: WebSocketManager;
  private eventEmitter: EventEmitter;
  private reconnecting: boolean = false;
  
  public isConnected: boolean = false;

  constructor(projectId: string, eventEmitter: EventEmitter) {
    this.websocketManager = new WebSocketManager();
    this.eventEmitter = eventEmitter;
    
    // Initialize the WebSocket URL with the project ID
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    this.websocketManager.setUrl(wsUrl);
  }

  /**
   * Connect to the voice service
   */
  async connect(): Promise<void> {
    try {
      console.log("Connecting to voice service...");
      
      // Connect to WebSocket - pass this instance to handle setup
      await this.websocketManager.connect((websocket, timeoutId) => {
        // Setup event handlers
        websocket.onopen = () => {
          console.log("WebSocket connection established");
          this.isConnected = true;
          this.eventEmitter.dispatchEvent('connected', { status: "connected" });
        };
        
        websocket.onerror = (event) => {
          console.error("WebSocket error:", event);
          this.isConnected = false;
          this.eventEmitter.dispatchEvent('error', {
            type: ErrorType.CONNECTION,
            message: "WebSocket connection error"
          });
        };
        
        websocket.onclose = () => {
          console.log("WebSocket connection closed");
          this.isConnected = false;
          this.eventEmitter.dispatchEvent('disconnected', { status: "disconnected" });
        };
        
        websocket.onmessage = (event) => {
          // Forward messages to the event emitter
          try {
            this.eventEmitter.dispatchEvent('message', event.data);
          } catch (error) {
            console.error("Error handling WebSocket message:", error);
          }
        };
      });
      
      // Update connection state
      this.isConnected = this.websocketManager.checkConnection();
      
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      
      const chatError: ChatError = {
        type: ErrorType.CONNECTION,
        message: "Failed to connect to voice service",
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      throw chatError;
    }
  }

  /**
   * Disconnect from the service
   */
  disconnect(): void {
    this.websocketManager.disconnect();
    this.isConnected = false;
    this.reconnecting = false;
  }

  /**
   * Get the WebSocket manager instance
   */
  getWebSocketManager(): WebSocketManager {
    return this.websocketManager;
  }

  /**
   * Check if the connection is active
   */
  checkConnection(): boolean {
    return this.isConnected && this.websocketManager.checkConnection();
  }

  /**
   * Handle reconnection attempts
   */
  handleReconnection(): void {
    if (!this.reconnecting) {
      this.reconnecting = true;
      this.connect().finally(() => {
        this.reconnecting = false;
      });
    }
  }
  
  /**
   * Try to reconnect if connection is lost
   */
  tryReconnect(): void {
    this.handleReconnection();
  }
  
  /**
   * Check if connection is active
   */
  isConnected(): boolean {
    return this.isConnected;
  }
}
