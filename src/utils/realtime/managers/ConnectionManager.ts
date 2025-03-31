
import { ConnectionState } from './ConnectionState';
import { IWebSocketManager } from './interfaces/IWebSocketManager';
import { ConnectionEventHandler } from './ConnectionEventHandler';
import { ReconnectionHandler } from '../ReconnectionHandler';
import { EventEmitter } from '../EventEmitter';
import { HeartbeatConfig } from './HeartbeatConfig';
import { ConnectionInitializer } from './ConnectionInitializer';

/**
 * Manages WebSocket connections and reconnection logic
 */
export class ConnectionManager {
  private webSocketManager: IWebSocketManager;
  private connectionState: ConnectionState;
  private connectionEventHandler: ConnectionEventHandler;
  private reconnectionHandler: ReconnectionHandler;
  private projectId: string;
  private eventEmitter: EventEmitter;
  private heartbeatConfig: HeartbeatConfig;
  private connectionInitializer: ConnectionInitializer;
  
  constructor(projectId: string, eventEmitter: EventEmitter, onReconnect: () => Promise<void>, webSocketManager: IWebSocketManager) {
    this.projectId = projectId;
    this.eventEmitter = eventEmitter;
    this.webSocketManager = webSocketManager;
    this.connectionState = new ConnectionState();
    this.reconnectionHandler = new ReconnectionHandler(onReconnect);
    this.connectionEventHandler = new ConnectionEventHandler(
      this.webSocketManager,
      this.connectionState,
      this.reconnectionHandler,
      this.eventEmitter
    );
    this.heartbeatConfig = new HeartbeatConfig();
    this.connectionInitializer = new ConnectionInitializer();
  }

  /**
   * Set heartbeat configuration
   */
  setHeartbeatConfig(pingInterval: number, pongTimeout: number, maxMissed: number): void {
    this.heartbeatConfig.setConfig(pingInterval, pongTimeout, maxMissed);
    
    // If already initialized, update the WebSocketManager
    this.webSocketManager.setHeartbeatConfig(
      this.heartbeatConfig.getPingInterval(),
      this.heartbeatConfig.getPongTimeout(),
      this.heartbeatConfig.getMaxMissed()
    );
  }

  /**
   * Create a WebSocket connection
   */
  async connect(): Promise<void> {
    // Set heartbeat configuration before connecting
    this.webSocketManager.setHeartbeatConfig(
      this.heartbeatConfig.getPingInterval(),
      this.heartbeatConfig.getPongTimeout(),
      this.heartbeatConfig.getMaxMissed()
    );
    
    // Initialize connection
    return this.connectionInitializer.initializeConnection(
      this.projectId,
      this.webSocketManager,
      this.connectionState,
      this.reconnectionHandler,
      this.eventEmitter
    );
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
  getWebSocketManager(): IWebSocketManager {
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
