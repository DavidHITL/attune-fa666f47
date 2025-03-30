
import { ConnectionState } from './ConnectionState';
import { WebSocketManager } from './WebSocketManager';
import { ConnectionEventHandler } from './ConnectionEventHandler';
import { ReconnectionHandler } from '../ReconnectionHandler';
import { EventEmitter } from '../EventEmitter';

/**
 * Manages WebSocket connections and reconnection logic
 */
export class ConnectionManager {
  private webSocketManager: WebSocketManager;
  private connectionState: ConnectionState;
  private connectionEventHandler: ConnectionEventHandler;
  private reconnectionHandler: ReconnectionHandler;
  private projectId: string;
  private eventEmitter: EventEmitter;
  
  constructor(projectId: string, eventEmitter: EventEmitter, onReconnect: () => Promise<void>) {
    this.projectId = projectId;
    this.eventEmitter = eventEmitter;
    this.webSocketManager = new WebSocketManager();
    this.connectionState = new ConnectionState();
    this.reconnectionHandler = new ReconnectionHandler(onReconnect);
    this.connectionEventHandler = new ConnectionEventHandler(
      this.webSocketManager,
      this.connectionState,
      this.reconnectionHandler,
      this.eventEmitter
    );
  }

  /**
   * Create a WebSocket connection
   */
  async connect(): Promise<void> {
    try {
      this.reconnectionHandler.clearTimeout();
      
      // Fix the WebSocket URL format to ensure it's correct
      // Use https and convert to wss protocol for secure connection
      const wsUrl = `wss://${this.projectId}.supabase.co/functions/v1/realtime-chat`;
      console.log("Attempting to connect to:", wsUrl);
      
      return await this.webSocketManager.connect(
        wsUrl,
        (websocket, timeoutId) => this.connectionEventHandler.setupEventHandlers(websocket, timeoutId)
      );
    } catch (error) {
      console.error("Failed to connect:", error);
      this.connectionState.setConnected(false);
      this.reconnectionHandler.tryReconnect();
      
      // Dispatch error event
      this.eventEmitter.dispatchEvent('error', {
        type: 'connection',
        message: 'Failed to connect to WebSocket',
        error
      });
      
      throw error;
    }
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnect(): void {
    this.reconnectionHandler.clearTimeout();
    this.webSocketManager.disconnect();
    this.connectionState.setConnected(false);
    this.reconnectionHandler.resetAttempts();
  }
  
  /**
   * Get the WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.webSocketManager.getWebSocket();
  }
  
  /**
   * Get the WebSocket manager
   */
  getWebSocketManager(): WebSocketManager {
    return this.webSocketManager;
  }
  
  /**
   * Check connection status
   */
  isConnected(): boolean {
    return this.connectionState.isConnected();
  }
  
  /**
   * Check if WebSocket is connected and ready
   */
  checkConnection(): boolean {
    return this.connectionState.checkConnection(this.webSocketManager.getWebSocket());
  }
  
  /**
   * Trigger reconnection attempt
   */
  tryReconnect(): void {
    this.reconnectionHandler.tryReconnect();
  }
}
