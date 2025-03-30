
import { HeartbeatManager } from './HeartbeatManager';
import { ConnectionLogger } from './ConnectionLogger';
import { WebSocketPromiseHandler } from './WebSocketPromiseHandler';

/**
 * Manages WebSocket connections
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  public messageHandler: ((event: MessageEvent) => void) | null = null;
  public wsUrl: string | null = null;
  private connectionAttempt = 0;
  private maxConnectionAttempts = 3;
  private protocols: string[] = ['json', 'openai-realtime'];
  
  private heartbeatManager: HeartbeatManager;
  private connectionLogger: ConnectionLogger;
  private promiseHandler: WebSocketPromiseHandler;

  constructor() {
    this.heartbeatManager = new HeartbeatManager(this.reconnect.bind(this));
    this.connectionLogger = new ConnectionLogger();
    this.promiseHandler = new WebSocketPromiseHandler();
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
      
      // Get auth token if available from Supabase
      let finalUrl = this.wsUrl;
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase.auth.getSession();
        
        if (data.session?.access_token) {
          console.log("[WebSocketManager] Adding auth token to connection");
          // Add token to URL as a query parameter
          const separator = finalUrl.includes('?') ? '&' : '?';
          finalUrl = `${finalUrl}${separator}token=${data.session.access_token}`;
        }
      } catch (error) {
        console.warn("[WebSocketManager] Could not get auth token:", error);
      }
      
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
        const timeoutId = window.setTimeout(() => {
          console.error("[WebSocketManager] Connection timed out");
          this.promiseHandler.rejectOpenPromise(new Error("Connection timeout"));
          
          if (this.websocket) {
            try {
              this.websocket.close();
            } catch (closeError) {
              console.error("[WebSocketManager] Error closing WebSocket after timeout:", closeError);
            }
          }
        }, 10000);
        
        // Configure handlers
        setupHandlers(this.websocket, timeoutId);
        
        // Add event listener for unhandled errors
        this.websocket.addEventListener('error', (event) => {
          console.error("[WebSocketManager] WebSocket error event:", event);
        });
        
        // Add close handler to stop logging
        this.websocket.addEventListener('close', (event) => {
          this.connectionLogger.stopLogging();
          this.connectionLogger.logCloseEvent(event);
        });
        
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
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error("[WebSocketManager] WebSocket is not connected, state:", 
                  this.websocket ? this.websocket.readyState : "null");
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      console.log("[WebSocketManager] Sending message:", message.type || "unknown type");
      this.websocket.send(messageStr);
      return true;
    } catch (error) {
      console.error("[WebSocketManager] Error sending WebSocket message:", error);
      return false;
    }
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
}
