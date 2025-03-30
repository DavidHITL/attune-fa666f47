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
        try {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data } = await supabase.auth.getSession();
          
          if (data.session?.access_token) {
            console.log("[Managers/WebSocketManager] Adding auth token to connection");
            // Add token to URL as a query parameter
            const separator = this.wsUrl.includes('?') ? '&' : '?';
            this.wsUrl = `${this.wsUrl}${separator}token=${data.session.access_token}`;
          }
        } catch (error) {
          console.warn("[Managers/WebSocketManager] Could not get auth token:", error);
        }
        
        // Create new connection
        this.websocket = new WebSocket(this.wsUrl);
        
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
        
        // Handle successful connection
        this.websocket.addEventListener('open', () => {
          console.log("[Managers/WebSocketManager] Connection established");
          window.clearTimeout(timeoutId);
          this.resolveOpenPromise();
        });
        
        // Handle connection errors
        this.websocket.addEventListener('error', (event) => {
          console.error("[Managers/WebSocketManager] Connection error:", event);
          window.clearTimeout(timeoutId);
          this.rejectOpenPromise(event);
        });
      } catch (error) {
        console.error("[Managers/WebSocketManager] Error setting up connection:", error);
        this.rejectOpenPromise(error);
      }
    });
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
