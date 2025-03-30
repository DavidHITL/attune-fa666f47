
import { SessionConfig, WebSocketMessageEvent } from './types';
import { ReconnectionHandler } from './ReconnectionHandler';
import { ConnectionState } from './ConnectionState';

/**
 * Manages WebSocket connections to the realtime chat service
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private projectId: string;
  private connectionState: ConnectionState;
  private reconnectionHandler: ReconnectionHandler;
  private connectionTimeout: number = 15000; // 15 second timeout (reduced)
  private openPromise: Promise<void> | null = null;
  private openPromiseResolve: (() => void) | null = null;
  private openPromiseReject: ((reason?: any) => void) | null = null;
  
  constructor(projectId: string) {
    this.projectId = projectId;
    this.connectionState = new ConnectionState();
    this.reconnectionHandler = new ReconnectionHandler(() => this.connect());
  }

  /**
   * Get connection state
   */
  get isConnected(): boolean {
    return this.connectionState.isConnected();
  }

  /**
   * Connect to the WebSocket server
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
          // Use the proper URL format for Supabase realtime-chat function
          // This properly routes through our edge function to OpenAI's Realtime API
          const wsUrl = `wss://${this.projectId}.supabase.co/functions/v1/realtime-chat`;
          console.log("Connecting to WebSocket:", wsUrl);
          
          this.websocket = new WebSocket(wsUrl);
          
          // Add specific headers to identify as OpenAI Realtime API client
          this.websocket.binaryType = "arraybuffer";
          
          const timeoutId = setTimeout(() => {
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
              this.openPromise = null;
              this.openPromiseResolve = null;
              this.openPromiseReject = null;
              
              // Attempt reconnection
              this.reconnectionHandler.tryReconnect();
            }
          }, this.connectionTimeout);
          
          this.websocket.onopen = () => {
            console.log("WebSocket connection established successfully");
            this.connectionState.setConnected(true);
            this.reconnectionHandler.resetAttempts();
            clearTimeout(timeoutId);
            
            if (this.openPromiseResolve) {
              this.openPromiseResolve();
            }
            
            // Reset the promise
            this.openPromise = null;
            this.openPromiseResolve = null;
            this.openPromiseReject = null;
          };
          
          this.websocket.onerror = (error) => {
            console.error("WebSocket connection error:", error);
            this.connectionState.setConnected(false);
            clearTimeout(timeoutId);
            
            if (this.openPromiseReject) {
              this.openPromiseReject(error);
            }
            
            // Reset the promise
            this.openPromise = null;
            this.openPromiseResolve = null;
            this.openPromiseReject = null;
            
            // Only try to reconnect if there are available resources
            if (error instanceof Event && (error as any).target?.readyState !== WebSocket.CLOSED) {
              this.reconnectionHandler.tryReconnect();
            } else {
              console.warn("Not attempting reconnection due to critical error state");
            }
          };
          
          this.websocket.onclose = (event) => {
            console.log("WebSocket connection closed:", event.code, event.reason);
            this.connectionState.setConnected(false);
            clearTimeout(timeoutId);
            
            // If promise is still pending, reject it
            if (this.openPromiseReject) {
              this.openPromiseReject(new Error(`Connection closed: ${event.code} ${event.reason}`));
              
              // Reset the promise
              this.openPromise = null;
              this.openPromiseResolve = null;
              this.openPromiseReject = null;
            }
            
            // Don't reconnect if it was a normal closure or insufficient resources (1006)
            if (event.code !== 1000 && event.code !== 1006) {
              this.reconnectionHandler.tryReconnect();
            } else if (event.code === 1006) {
              // Handle the "insufficient resources" error
              console.warn("WebSocket closed due to insufficient resources - attempting delayed reconnect");
              // Wait 3-5 seconds before trying again to let resources free up
              setTimeout(() => {
                if (this.reconnectionHandler.getAttempts() < 5) { // Limit retries for resource issues
                  this.reconnectionHandler.tryReconnect();
                }
              }, 5000);
            }
          };
        } catch (error) {
          console.error("Error creating WebSocket:", error);
          
          if (this.openPromiseReject) {
            this.openPromiseReject(error);
          }
          
          // Reset the promise
          this.openPromise = null;
          this.openPromiseResolve = null;
          this.openPromiseReject = null;
          
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
   * Configure the session settings
   */
  configureSession(sessionConfig: SessionConfig): boolean {
    if (!this.checkConnection()) {
      console.error("Cannot configure session: WebSocket not connected");
      return false;
    }
    
    try {
      console.log("Configuring session with OpenAI Realtime API settings...");
      this.websocket!.send(JSON.stringify(sessionConfig));
      return true;
    } catch (error) {
      console.error("Failed to configure session:", error);
      this.reconnectionHandler.tryReconnect();
      return false;
    }
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    if (!this.checkConnection()) {
      console.error("WebSocket not connected, can't send message");
      return false;
    }
    
    try {
      console.log("Sending message to OpenAI Realtime API:", message.type || "unknown type");
      this.websocket!.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      this.reconnectionHandler.tryReconnect();
      return false;
    }
  }

  /**
   * Set up message handler for WebSocket events
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    if (!this.websocket) return;
    this.websocket.onmessage = handler;
  }

  /**
   * Close the WebSocket connection
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
    
    // Clear any pending promises
    this.openPromise = null;
    this.openPromiseResolve = null;
    this.openPromiseReject = null;
  }
  
  /**
   * Check if WebSocket is currently connected
   */
  checkConnection(): boolean {
    return this.connectionState.checkConnection(this.websocket);
  }
}
