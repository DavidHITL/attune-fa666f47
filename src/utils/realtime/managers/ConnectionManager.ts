
import { SessionConfig, WebSocketMessageEvent } from '../types';
import { ReconnectionHandler } from '../ReconnectionHandler';
import { ConnectionState } from '../ConnectionState';

/**
 * Manages WebSocket connections and reconnection logic
 */
export class ConnectionManager {
  private websocket: WebSocket | null = null;
  private connectionState: ConnectionState;
  private reconnectionHandler: ReconnectionHandler;
  private connectionTimeout: number = 15000; // 15 second timeout
  private openPromise: Promise<void> | null = null;
  private openPromiseResolve: (() => void) | null = null;
  private openPromiseReject: ((reason?: any) => void) | null = null;
  
  constructor(private projectId: string, onReconnect: () => Promise<void>) {
    this.connectionState = new ConnectionState();
    this.reconnectionHandler = new ReconnectionHandler(onReconnect);
  }

  /**
   * Create a WebSocket connection
   */
  async connect(): Promise<void> {
    try {
      // Don't attempt multiple connections simultaneously
      if (this.openPromise) {
        console.log("Connection already in progress, returning existing promise");
        return this.openPromise;
      }
      
      this.reconnectionHandler.clearTimeout();
      
      // Close any existing connection first
      if (this.websocket) {
        try {
          this.websocket.close(1000, "Reconnecting");
        } catch (err) {
          console.warn("Error closing existing WebSocket:", err);
        }
        this.websocket = null;
      }
      
      // Create a new promise for this connection attempt
      this.openPromise = new Promise<void>((resolve, reject) => {
        this.openPromiseResolve = resolve;
        this.openPromiseReject = reject;
        
        try {
          const wsUrl = `wss://${this.projectId}.supabase.co/functions/v1/realtime-chat`;
          console.log("Connecting to WebSocket:", wsUrl);
          
          this.websocket = new WebSocket(wsUrl);
          this.websocket.binaryType = "arraybuffer";
          
          // Use window.setTimeout to ensure correct type
          const timeoutId = window.setTimeout(() => {
            if (!this.connectionState.isConnected()) {
              console.error("WebSocket connection timeout after", this.connectionTimeout, "ms");
              if (this.websocket) {
                try {
                  this.websocket.close();
                } catch (err) {
                  console.warn("Error closing WebSocket after timeout:", err);
                }
              }
              
              if (this.openPromiseReject) {
                this.openPromiseReject(new Error("Connection timeout"));
              }
              
              // Reset the promise
              this.resetPromise();
              
              // Attempt reconnection
              this.reconnectionHandler.tryReconnect();
            }
          }, this.connectionTimeout);
          
          this.setupEventHandlers(timeoutId);
          
        } catch (error) {
          console.error("Error creating WebSocket:", error);
          
          if (this.openPromiseReject) {
            this.openPromiseReject(error);
          }
          
          this.resetPromise();
          this.reconnectionHandler.tryReconnect();
          reject(error);
        }
      });
      
      return this.openPromise;
    } catch (error) {
      console.error("Failed to connect:", error);
      this.connectionState.setConnected(false);
      this.reconnectionHandler.tryReconnect();
      throw error;
    }
  }
  
  /**
   * Set up WebSocket event handlers
   */
  private setupEventHandlers(timeoutId: number): void {
    if (!this.websocket) return;
    
    this.websocket.onopen = () => {
      console.log("WebSocket connection established successfully");
      this.connectionState.setConnected(true);
      this.reconnectionHandler.resetAttempts();
      window.clearTimeout(timeoutId);
      
      if (this.openPromiseResolve) {
        this.openPromiseResolve();
      }
      
      this.resetPromise();
    };
    
    this.websocket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      this.connectionState.setConnected(false);
      window.clearTimeout(timeoutId);
      
      if (this.openPromiseReject) {
        this.openPromiseReject(error);
      }
      
      this.resetPromise();
      
      // Gentler approach to reconnection - don't immediately discard on error
      // This will allow the onclose handler to attempt reconnection
      console.log("WebSocket error - will attempt reconnection on close event");
    };
    
    this.websocket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      this.connectionState.setConnected(false);
      window.clearTimeout(timeoutId);
      
      if (this.openPromiseReject) {
        this.openPromiseReject(new Error(`Connection closed: ${event.code} ${event.reason}`));
        this.resetPromise();
      }
      
      // Always attempt reconnection except for normal closure
      if (event.code !== 1000) {
        console.log(`Abnormal close (${event.code}), attempting reconnection`);
        this.reconnectionHandler.tryReconnect();
      } else if (event.code === 1006) { // Fix: This comparison now uses proper number comparison
        // Code 1006 means abnormal closure, could be network issues
        console.log("Abnormal closure detected, attempting reconnection");
        setTimeout(() => {
          if (this.reconnectionHandler.getAttempts() < 5) {
            this.reconnectionHandler.tryReconnect();
          }
        }, 2000); // Add a small delay before reconnection attempt
      }
    };
  }
  
  /**
   * Reset the connection promise state
   */
  private resetPromise(): void {
    this.openPromise = null;
    this.openPromiseResolve = null;
    this.openPromiseReject = null;
  }

  /**
   * Disconnect WebSocket connection
   */
  disconnect(): void {
    this.reconnectionHandler.clearTimeout();
    
    if (this.websocket) {
      try {
        this.websocket.close(1000, "Client disconnected normally");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }
      this.websocket = null;
    }
    this.connectionState.setConnected(false);
    this.reconnectionHandler.resetAttempts();
    
    this.resetPromise();
  }
  
  /**
   * Get the WebSocket instance
   */
  getWebSocket(): WebSocket | null {
    return this.websocket;
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
    return this.connectionState.checkConnection(this.websocket);
  }
  
  /**
   * Trigger reconnection attempt
   */
  tryReconnect(): void {
    this.reconnectionHandler.tryReconnect();
  }
}
