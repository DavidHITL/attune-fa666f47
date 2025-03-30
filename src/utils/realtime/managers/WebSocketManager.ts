
/**
 * Manages WebSocket connections
 */
export class WebSocketManager {
  private websocket: WebSocket | null = null;
  private openPromiseResolve: (() => void) | null = null;
  private openPromiseReject: ((reason?: any) => void) | null = null;
  public messageHandler: ((event: MessageEvent) => void) | null = null;
  public wsUrl: string | null = null;

  /**
   * Set the WebSocket URL
   */
  setUrl(url: string): void {
    console.log("[Managers/WebSocketManager] Setting URL:", url);
    this.wsUrl = url;
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
        
        // Create new connection
        try {
          this.websocket = new WebSocket(finalUrl);
          
          // Log connection readyState changes for debugging
          this.logReadyStateChange();
          
          // Set binary type for audio data
          this.websocket.binaryType = "arraybuffer";
          
          // Set connection timeout
          const timeoutId = window.setTimeout(() => {
            console.error("[Managers/WebSocketManager] Connection timed out");
            this.rejectOpenPromise(new Error("Connection timeout"));
            this.websocket?.close();
          }, 10000);
          
          // Configure handlers
          setupHandlers(this.websocket, timeoutId);
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
    const stateCheckInterval = setInterval(() => {
      if (!this.websocket) {
        clearInterval(stateCheckInterval);
        return;
      }
      console.log("[Managers/WebSocketManager] Current state:", getReadyStateString(this.websocket.readyState));
    }, 3000); // Check every 3 seconds
    
    // Clear interval when connection closes
    this.websocket.onclose = (event) => {
      clearInterval(stateCheckInterval);
      console.log("[Managers/WebSocketManager] WebSocket closed. Code:", event.code, "Reason:", event.reason);
    };
  }
  
  /**
   * Close WebSocket connection
   */
  disconnect(): void {
    console.log("[Managers/WebSocketManager] Disconnecting");
    this.websocket?.close();
    this.websocket = null;
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
      this.websocket.onmessage = this.messageHandler;
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
