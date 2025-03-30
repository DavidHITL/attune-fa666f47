
/**
 * Manages WebSocket connections
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private openPromiseResolve: (() => void) | null = null;
  private openPromiseReject: ((reason?: any) => void) | null = null;
  public messageHandler: ((event: MessageEvent) => void) | null = null;
  public wsUrl: string | null = null;
  private connectionAttempt = 0;
  private maxConnectionAttempts = 3;
  private connectionLogInterval: number | null = null;
  private protocols: string[] = ['json', 'openai-realtime']; // Define supported protocols

  /**
   * Set the WebSocket URL
   */
  setUrl(url: string): void {
    console.log("[Managers/WebSocketManager] Setting URL:", url);
    this.wsUrl = url;
  }

  /**
   * Set the WebSocket protocols
   */
  setProtocols(protocols: string[]): void {
    console.log("[Managers/WebSocketManager] Setting protocols:", protocols);
    this.protocols = protocols;
  }

  /**
   * Connect to a WebSocket endpoint
   */
  async connect(
    setupHandlers: (websocket: WebSocket, timeoutId: number) => void
  ): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.wsUrl) {
          const error = new Error("WebSocket URL not set");
          console.error("[Managers/WebSocketManager] Connection error:", error);
          reject(error);
          return;
        }
        
        console.log("[Managers/WebSocketManager] Connecting to:", this.wsUrl);
        console.log("[Managers/WebSocketManager] Using protocols:", this.protocols);
        
        // Store reference to resolve/reject functions
        this.openPromiseResolve = resolve;
        this.openPromiseReject = reject;
        
        // Close existing connection if any
        if (this.websocket) {
          try {
            console.log("[Managers/WebSocketManager] Closing existing connection");
            this.websocket.close();
          } catch (error) {
            console.warn("[Managers/WebSocketManager] Error closing existing WebSocket:", error);
          }
        }
        
        // Reset connection counter if it's a new connection attempt
        if (this.connectionAttempt >= this.maxConnectionAttempts) {
          this.connectionAttempt = 0;
        }
        
        // Increment connection attempt
        this.connectionAttempt++;
        console.log(`[Managers/WebSocketManager] Connection attempt ${this.connectionAttempt} of ${this.maxConnectionAttempts}`);
        
        // Get auth token if available from Supabase
        let finalUrl = this.wsUrl;
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase.auth.getSession();
          
          if (data.session?.access_token) {
            console.log("[Managers/WebSocketManager] Adding auth token to connection");
            // Add token to URL as a query parameter
            const separator = finalUrl.includes('?') ? '&' : '?';
            finalUrl = `${finalUrl}${separator}token=${data.session.access_token}`;
          }
        } catch (error) {
          console.warn("[Managers/WebSocketManager] Could not get auth token:", error);
        }
        
        console.log("[Managers/WebSocketManager] Final connection URL:", finalUrl);
        
        // Create new connection with protocols
        try {
          this.websocket = new WebSocket(finalUrl, this.protocols);
          
          // Log connection readyState changes for debugging
          this.logReadyStateChange();
          
          // Set binary type for audio data
          this.websocket.binaryType = "arraybuffer";
          
          // Set connection timeout
          const timeoutId = window.setTimeout(() => {
            console.error("[Managers/WebSocketManager] Connection timed out");
            this.rejectOpenPromise(new Error("Connection timeout"));
            
            if (this.websocket) {
              try {
                this.websocket.close();
              } catch (closeError) {
                console.error("[Managers/WebSocketManager] Error closing WebSocket after timeout:", closeError);
              }
            }
          }, 10000);
          
          // Configure handlers
          setupHandlers(this.websocket, timeoutId);
          
          // Add event listener for unhandled errors
          this.websocket.addEventListener('error', (event) => {
            console.error("[Managers/WebSocketManager] WebSocket error event:", event);
          });
          
        } catch (wsError) {
          console.error("[Managers/WebSocketManager] Error creating WebSocket:", wsError);
          reject(wsError);
        }
      } catch (error) {
        console.error("[Managers/WebSocketManager] Error setting up connection:", error);
        this.rejectOpenPromise(error);
      }
    });
  }
  
  /**
   * Log WebSocket readyState changes
   */
  private logReadyStateChange(): void {
    if (!this.websocket) return;
    
    const getReadyStateString = (state: number): string => {
      switch (state) {
        case WebSocket.CONNECTING: return "CONNECTING (0)";
        case WebSocket.OPEN: return "OPEN (1)";
        case WebSocket.CLOSING: return "CLOSING (2)";
        case WebSocket.CLOSED: return "CLOSED (3)";
        default: return `UNKNOWN (${state})`;
      }
    };
    
    console.log("[Managers/WebSocketManager] Initial state:", getReadyStateString(this.websocket.readyState));
    
    // Set up interval to log state changes
    if (this.connectionLogInterval) {
      clearInterval(this.connectionLogInterval);
    }
    
    this.connectionLogInterval = window.setInterval(() => {
      if (!this.websocket) {
        if (this.connectionLogInterval) {
          clearInterval(this.connectionLogInterval);
          this.connectionLogInterval = null;
        }
        return;
      }
      console.log("[Managers/WebSocketManager] Current state:", getReadyStateString(this.websocket.readyState));
    }, 3000); // Check every 3 seconds
    
    // Clear interval when connection closes
    this.websocket.onclose = (event) => {
      if (this.connectionLogInterval) {
        clearInterval(this.connectionLogInterval);
        this.connectionLogInterval = null;
      }
      console.log(`[Managers/WebSocketManager] WebSocket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
      console.log("WebSocket close event details:", JSON.stringify({
        wasClean: event.wasClean,
        code: event.code,
        reason: event.reason
      }));
    };
  }
  
  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    console.log("[Managers/WebSocketManager] Disconnecting");
    
    if (this.connectionLogInterval) {
      clearInterval(this.connectionLogInterval);
      this.connectionLogInterval = null;
    }
    
    if (this.websocket) {
      try {
        this.websocket.close();
      } catch (error) {
        console.error("[Managers/WebSocketManager] Error closing WebSocket during disconnect:", error);
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
    console.log("[Managers/WebSocketManager] Connection check:", isConnected, 
              "WebSocket state:", this.websocket ? this.websocket.readyState : "null");
    return isConnected;
  }

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    if (!this.websocket || this.websocket.readyState !== WebSocket.OPEN) {
      console.error("[Managers/WebSocketManager] WebSocket is not connected, state:", 
                  this.websocket ? this.websocket.readyState : "null");
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      console.log("[Managers/WebSocketManager] Sending message:", message.type || "unknown type");
      this.websocket.send(messageStr);
      return true;
    } catch (error) {
      console.error("[Managers/WebSocketManager] Error sending WebSocket message:", error);
      return false;
    }
  }

  /**
   * Set up a handler for WebSocket messages
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    console.log("[Managers/WebSocketManager] Setting message handler");
    this.messageHandler = handler;
    
    if (this.websocket) {
      this.websocket.onmessage = (event) => {
        try {
          // Process the message through the handler
          if (this.messageHandler) {
            this.messageHandler(event);
          }
        } catch (error) {
          console.error("[Managers/WebSocketManager] Error in message handler:", error);
        }
      };
    }
  }

  /**
   * Resolve the open promise
   */
  resolveOpenPromise(): void {
    if (this.openPromiseResolve) {
      this.openPromiseResolve();
      this.openPromiseResolve = null;
    }
  }

  /**
   * Reject the open promise
   */
  rejectOpenPromise(reason: any): void {
    if (this.openPromiseReject) {
      this.openPromiseReject(reason);
      this.openPromiseReject = null;
    }
  }
}
