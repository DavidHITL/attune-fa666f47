
import { SessionConfig, WebSocketMessageEvent } from './types';
import { ConnectionManager } from './managers/ConnectionManager';
import { MessageManager } from './managers/MessageManager';

/**
 * Manages WebSocket connections to the realtime chat service
 */
export class WebSocketManager {
  private connectionManager: ConnectionManager;
  private messageManager: MessageManager;
  
  constructor(projectId: string) {
    this.connectionManager = new ConnectionManager(
      projectId,
      () => this.connect()
    );
    
    this.messageManager = new MessageManager(
      () => this.connectionManager.getWebSocket(),
      () => this.connectionManager.tryReconnect()
    );
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.connectionManager.isConnected();
  }

  /**
   * Connect to the WebSocket server
   */
  async connect(): Promise<void> {
    return this.connectionManager.connect();
  }
  
  /**
   * Configure the session settings
   */
  configureSession(sessionConfig: SessionConfig): boolean {
    return this.messageManager.configureSession(sessionConfig);
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    return this.messageManager.send(message);
  }

  /**
   * Set up message handler for WebSocket events
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    this.messageManager.setMessageHandler(handler);
  }

  /**
   * Close the WebSocket connection
   */
  disconnect(): void {
    this.connectionManager.disconnect();
  }
  
  /**
   * Check if WebSocket is currently connected
   */
  checkConnection(): boolean {
    return this.connectionManager.checkConnection();
  }
}
