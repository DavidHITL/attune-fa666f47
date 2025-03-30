
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
    this.websocketManager = new WebSocketManager(projectId);
    this.eventEmitter = eventEmitter;
  }

  /**
   * Connect to the voice service
   */
  async connect(): Promise<void> {
    try {
      console.log("Connecting to voice service...");
      
      // Connect to WebSocket
      await this.websocketManager.connect();
      this.isConnected = this.websocketManager.isConnected;
      
      this.eventEmitter.dispatchEvent('connected', { status: "connected" });
      
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
}
