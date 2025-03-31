import { ConnectionStateManager } from './websocket/ConnectionStateManager';
import { WebSocketPromiseHandler } from './WebSocketPromiseHandler';
import { HeartbeatManager } from './HeartbeatManager';
import { ConnectionLogger } from './ConnectionLogger';
import { WebSocketAuthHandler } from './websocket/WebSocketAuthHandler';
import { WebSocketEventHandler } from './websocket/WebSocketEventHandler';
import { WebSocketMessageHandler } from './websocket/WebSocketMessageHandler';
import { IWebSocketManager } from './interfaces/IWebSocketManager';

/**
 * Manages WebSocket connections
 */
export class WebSocketManager implements IWebSocketManager {
  private websocket: WebSocket | null = null;
  public messageHandler: ((event: MessageEvent) => void) | null = null;
  public wsUrl: string | null = null;
  private connectionAttempt = 0;
  private maxConnectionAttempts = 3;
  private protocols: string[] = ['json', 'openai-realtime'];
  
  private heartbeatManager: HeartbeatManager;
  private connectionLogger: ConnectionLogger;
  private promiseHandler: WebSocketPromiseHandler;
  private stateManager: ConnectionStateManager;
  private authHandler: WebSocketAuthHandler;
  private eventHandler: WebSocketEventHandler;
  private messageManager: WebSocketMessageHandler;

  constructor() {
    this.heartbeatManager = new HeartbeatManager(this.reconnect.bind(this));
    this.connectionLogger = new ConnectionLogger();
    this.promiseHandler = new WebSocketPromiseHandler();
    this.stateManager = new ConnectionStateManager();
    this.authHandler = new WebSocketAuthHandler();
    this.eventHandler = new WebSocketEventHandler();
    this.messageManager = new WebSocketMessageHandler();
  }

  /**
   * Set the WebSocket URL
   */
  setUrl(url: string): void {
    console.log("[WebSocketManager] Setting URL:", url);
    this.wsUrl = url;
  }

  /**
   * Set the WebSocket protocols
   */
  setProtocols(protocols: string[]): void {
    console.log("[WebSocketManager] Setting protocols:", protocols);
    this.protocols = protocols;
  }

  /**
   * Set heartbeat configuration
   */
  setHeartbeatConfig(pingIntervalMs: number, pongTimeoutMs: number, maxMissedHeartbeats: number): void {
    this.heartbeatManager.setConfig(pingIntervalMs, pongTimeoutMs, maxMissedHeartbeats);
  }

  /**
   * Connect to a WebSocket endpoint
   */
  async connect(
    setupHandlers: (websocket: WebSocket, timeoutId: number) => void
  ): Promise<void> {
    try {
      if (!this.wsUrl) {
        const error = new Error("WebSocket URL not set");
        console.error("[WebSocketManager] Connection error:", error);
        throw error;
      }
      
      console.log("[WebSocketManager] Connecting to:", this.wsUrl);
      console.log("[WebSocketManager] Using protocols:", this.protocols);
      
      // Close existing connection if any
      if (this.websocket) {
        try {
          console.log("[WebSocketManager] Closing existing connection");
          this.websocket.close();
        } catch (error) {
          console.warn("[WebSocketManager] Error closing existing WebSocket:", error);
        }
      }
      
      // Reset connection counter if it's a new connection attempt
      if (this.connectionAttempt >= this.maxConnectionAttempts) {
        this.connectionAttempt = 0;
      }
      
      // Increment connection attempt
      this.connectionAttempt++;
      console.log(`[WebSocketManager] Connection attempt ${this.connectionAttempt} of ${this.maxConnectionAttempts}`);
      
      // Get the final URL with auth token if available
      const finalUrl = await this.authHandler.getAuthenticatedUrl(this.wsUrl);
      
      console.log("[WebSocketManager] Final connection URL:", finalUrl);
      
      // Create a connection promise
      const connectionPromise = this.promiseHandler.createConnectionPromise();
      
      // Create new connection with protocols
      try {
        this.websocket = new WebSocket(finalUrl, this.protocols);
        
        // Log connection readyState changes for debugging
        this.connectionLogger.startLogging(this.websocket);
        
        // Set binary type for audio data
        this.websocket.binaryType = "arraybuffer";
        
        // Set connection timeout
        const timeoutId = this.eventHandler.setupConnectionTimeout(
          this.websocket,
          this.promiseHandler,
          10000
        );
        
        // Configure handlers
        setupHandlers(this.websocket, timeoutId);
        
        // Add event listeners
        this.eventHandler.setupErrorHandlers(this.websocket);
        this.eventHandler.setupCloseHandlers(this.websocket, this.connectionLogger);
        
        return connectionPromise;
      } catch (wsError) {
        console.error("[WebSocketManager] Error creating WebSocket:", wsError);
        throw wsError;
      }
    } catch (error) {
      console.error("[WebSocketManager] Error setting up connection:", error);
      this.promiseHandler.rejectOpenPromise(error);
      throw error;
    }
  }

  /**
   * Start heartbeat mechanism for keeping connection alive
   */
  startHeartbeat(): void {
    this.heartbeatManager.start(() => this.send({ 
      type: "ping", 
      timestamp: new Date().toISOString() 
    }));
  }
  
  /**
   * Stop heartbeat mechanism
   */
  stopHeartbeat(): void {
    this.heartbeatManager.stop();
  }
  
  /**
   * Handle pong response
   */
  handlePong(): void {
    this.heartbeatManager.handlePong();
  }
  
  /**
   * Reconnect WebSocket
   */
  reconnect(): void {
    console.log("[WebSocketManager] Attempting to reconnect");
    if (this.websocket) {
      try {
        this.websocket.close();
      } catch (error) {
        console.warn("[WebSocketManager] Error closing WebSocket during reconnect:", error);
      }
      this.websocket = null;
    }
    
    // Trigger reconnection through ConnectionManager
    const event = new CustomEvent('websocket-reconnect-needed');
    window.dispatchEvent(event);
  }
  
  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    console.log("[WebSocketManager] Disconnecting");
    
    this.stopHeartbeat();
    this.connectionLogger.stopLogging();
    
    if (this.websocket) {
      try {
        this.websocket.close();
      } catch (error) {
        console.error("[WebSocketManager] Error closing WebSocket during disconnect:", error);
      }
      this.websocket = null;
    }
  }
  
  /**
   * Get WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.websocket;
  }

  /**
   * Check if WebSocket is connected
   */
  checkConnection(): boolean {
    const isConnected = !!this.websocket && this.websocket.readyState === WebSocket.OPEN;
    console.log("[WebSocketManager] Connection check:", isConnected, 
              "WebSocket state:", this.websocket ? this.websocket.readyState : "null");
    return isConnected;
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    return this.messageManager.sendMessage(this.websocket, message);
  }

  /**
   * Set up a handler for WebSocket messages
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    console.log("[WebSocketManager] Setting message handler");
    this.messageHandler = handler;
    
    if (this.websocket) {
      this.websocket.onmessage = (event) => {
        try {
          // Process the message through the handler
          if (this.messageHandler) {
            this.messageHandler(event);
          }
        } catch (error) {
          console.error("[WebSocketManager] Error in message handler:", error);
        }
      };
    }
  }

  /**
   * Resolve the open promise
   */
  resolveOpenPromise(): void {
    this.promiseHandler.resolveOpenPromise();
  }

  /**
   * Reject the open promise
   */
  rejectOpenPromise(reason: any): void {
    this.promiseHandler.rejectOpenPromise(reason);
  }

  /**
   * Get current connection attempt count (required for compatibility)
   */
  getConnectionAttempt(): number {
    return this.connectionAttempt;
  }

  /**
   * Set current connection attempt count (required for compatibility)
   */
  setConnectionAttempt(attempt: number): void {
    this.connectionAttempt = attempt;
  }

  /**
   * Get maximum connection attempts (required for compatibility)
   */
  getMaxConnectionAttempts(): number {
    return this.maxConnectionAttempts;
  }
}
