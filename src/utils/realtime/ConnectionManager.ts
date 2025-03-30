
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
  
  private _isConnected: boolean = false;

  constructor(projectId: string, eventEmitter: EventEmitter) {
    this.websocketManager = new WebSocketManager();
    this.eventEmitter = eventEmitter;
    
    // Initialize the WebSocket URL with the project ID
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    console.log("[ConnectionManager] Setting WebSocket URL:", wsUrl);
    this.websocketManager.setUrl(wsUrl);
  }

  /**
   * Connect to the voice service
   */
  async connect(): Promise<void> {
    try {
      console.log("[ConnectionManager] Connecting to voice service...");
      
      // Connect to WebSocket - pass this instance to handle setup
      await this.websocketManager.connect((websocket, timeoutId) => {
        console.log("[ConnectionManager] WebSocket connection initiated, setting up handlers");
        
        // Setup event handlers
        websocket.onopen = () => {
          console.log("[ConnectionManager] WebSocket connection established");
          this._isConnected = true;
          this.eventEmitter.dispatchEvent('connected', { status: "connected" });
        };
        
        websocket.onerror = (event) => {
          console.error("[ConnectionManager] WebSocket error:", event);
          this._isConnected = false;
          this.eventEmitter.dispatchEvent('error', {
            type: ErrorType.CONNECTION,
            message: "WebSocket connection error"
          });
        };
        
        websocket.onclose = () => {
          console.log("[ConnectionManager] WebSocket connection closed");
          this._isConnected = false;
          this.eventEmitter.dispatchEvent('disconnected', { status: "disconnected" });
        };
        
        websocket.onmessage = (event) => {
          // Forward messages to the event emitter
          try {
            console.log("[ConnectionManager] WebSocket message received:", typeof event.data);
            this.eventEmitter.dispatchEvent('message', event.data);
          } catch (error) {
            console.error("[ConnectionManager] Error handling WebSocket message:", error);
          }
        };
      });
      
      // Update connection state
      this._isConnected = this.websocketManager.checkConnection();
      console.log("[ConnectionManager] Connection status after connect:", this._isConnected);
      
    } catch (error) {
      console.error("[ConnectionManager] Failed to connect:", error);
      this._isConnected = false;
      
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
    this._isConnected = false;
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
    return this._isConnected && this.websocketManager.checkConnection();
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
    return this._isConnected;
  }
}
