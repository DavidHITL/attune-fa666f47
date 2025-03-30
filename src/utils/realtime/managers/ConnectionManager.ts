
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
      
      // Build the WebSocket URL with the correct format
      // Format should be: wss://[project-id].functions.supabase.co/functions/v1/realtime-chat
      const wsUrl = `https://${this.projectId}.supabase.co/functions/v1/realtime-chat`;
      
      console.log("[ConnectionManager] Initializing connection to:", wsUrl);
      console.log("[ConnectionManager] Project ID:", this.projectId);
      
      // Set the WebSocket URL
      this.webSocketManager.setUrl(wsUrl);
      
      // Connect to the WebSocket server
      return await this.webSocketManager.connect((websocket, timeoutId) => 
        this.connectionEventHandler.setupEventHandlers(websocket, timeoutId)
      );
    } catch (error) {
      console.error("[ConnectionManager] Failed to connect:", error);
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
