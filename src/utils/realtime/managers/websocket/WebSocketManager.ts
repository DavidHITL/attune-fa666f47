
import { WebSocketConnectionHandler } from './WebSocketConnectionHandler';
import { WebSocketTimeoutManager } from './WebSocketTimeoutManager';
import { WebSocketMessageManager } from './WebSocketMessageManager';
import { HeartbeatManager } from '../HeartbeatManager';
import { ConnectionLogger } from '../ConnectionLogger';
import { WebSocketPromiseHandler } from '../WebSocketPromiseHandler';
import { WebSocketAuthHandler } from './WebSocketAuthHandler';
import { IWebSocketManager } from '../interfaces/IWebSocketManager';

/**
 * Manages WebSocket connections
 */
export class WebSocketManager implements IWebSocketManager {
  private websocket: WebSocket | null = null;
  private wsUrl: string | null = null;
  private protocols: string[] = ['json']; // Default to just 'json' for wider compatibility
  private connectionAttempt = 0;
  private maxConnectionAttempts = 3;
  
  // Component managers
  private heartbeatManager: HeartbeatManager;
  private connectionLogger: ConnectionLogger;
  private promiseHandler: WebSocketPromiseHandler;
  private messageManager: WebSocketMessageManager;
  private connectionHandler: WebSocketConnectionHandler;
  private timeoutManager: WebSocketTimeoutManager;
  private authHandler: WebSocketAuthHandler;

  constructor() {
    this.heartbeatManager = new HeartbeatManager(this.reconnect.bind(this));
    this.connectionLogger = new ConnectionLogger();
    this.promiseHandler = new WebSocketPromiseHandler();
    this.messageManager = new WebSocketMessageManager();
    this.authHandler = new WebSocketAuthHandler();
    this.connectionHandler = new WebSocketConnectionHandler();
    this.timeoutManager = new WebSocketTimeoutManager(this.promiseHandler);
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
      
      // Handle connection attempts
      this.connectionHandler.handleConnectionAttempt(this);
      
      // Get the final URL with auth token if available
      const finalUrl = await this.authHandler.getAuthenticatedUrl(this.wsUrl);
      
      console.log("[WebSocketManager] Final connection URL:", finalUrl);
      
      // Create a connection promise
      const connectionPromise = this.promiseHandler.createConnectionPromise();
      
      // Try connection with different protocol combinations if needed
      try {
        // First try with the specified protocols
        if (this.protocols.length > 0) {
          console.log("[WebSocketManager] Attempting connection with protocols:", this.protocols);
          this.websocket = new WebSocket(finalUrl, this.protocols);
        } else {
          // Fall back to no protocols
          console.log("[WebSocketManager] Attempting connection without protocols");
          this.websocket = new WebSocket(finalUrl);
        }
        
        // Log connection readyState changes for debugging
        this.connectionLogger.startLogging(this.websocket);
        
        // Set binary type for audio data
        this.websocket.binaryType = "arraybuffer";
        
        // Set connection timeout (increase to 15 seconds for slower connections)
        const timeoutId = this.timeoutManager.setupConnectionTimeout(this.websocket, 15000);
        
        // Configure handlers
        setupHandlers(this.websocket, timeoutId);
        
        // Add error and close event listeners
        this.connectionHandler.setupEventHandlers(this.websocket, this.connectionLogger);
        
        return connectionPromise;
      } catch (wsError) {
        console.error("[WebSocketManager] Error creating WebSocket:", wsError);
        
        // If we failed with protocols, try without any protocols
        if (this.protocols.length > 0 && !this.websocket) {
          console.log("[WebSocketManager] Retrying connection without protocols");
          this.protocols = [];
          this.websocket = new WebSocket(finalUrl);
          
          // Set up the same handlers and timeout
          this.connectionLogger.startLogging(this.websocket);
          this.websocket.binaryType = "arraybuffer";
          const timeoutId = this.timeoutManager.setupConnectionTimeout(this.websocket, 15000);
          setupHandlers(this.websocket, timeoutId);
          this.connectionHandler.setupEventHandlers(this.websocket, this.connectionLogger);
          
          return connectionPromise;
        }
        
        throw wsError;
      }
    } catch (error) {
      console.error("[WebSocketManager] Error setting up connection:", error);
      this.promiseHandler.rejectOpenPromise(error);
      throw error;
    }
  }

  /**
   * Get current connection attempt count
   */
  getConnectionAttempt(): number {
    return this.connectionAttempt;
  }

  /**
   * Set current connection attempt count
   */
  setConnectionAttempt(attempt: number): void {
    this.connectionAttempt = attempt;
  }

  /**
   * Get maximum connection attempts
   */
  getMaxConnectionAttempts(): number {
    return this.maxConnectionAttempts;
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
    
    if (this.websocket) {
      this.websocket.onmessage = (event) => {
        try {
          // Process the message through the handler
          if (handler) {
            handler(event);
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
}
