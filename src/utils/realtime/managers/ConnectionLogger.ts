
/**
 * Handles logging of WebSocket connection states
 */
export class ConnectionLogger {
  private connectionLogInterval: number | null = null;
  
  /**
   * Start logging WebSocket readyState changes
   */
  startLogging(websocket: WebSocket): void {
    if (this.connectionLogInterval) {
      clearInterval(this.connectionLogInterval);
    }
    
    const getReadyStateString = (state: number): string => {
      switch (state) {
        case WebSocket.CONNECTING: return "CONNECTING (0)";
        case WebSocket.OPEN: return "OPEN (1)";
        case WebSocket.CLOSING: return "CLOSING (2)";
        case WebSocket.CLOSED: return "CLOSED (3)";
        default: return `UNKNOWN (${state})`;
      }
    };
    
    console.log("[ConnectionLogger] Initial state:", getReadyStateString(websocket.readyState));
    
    this.connectionLogInterval = window.setInterval(() => {
      console.log("[ConnectionLogger] Current state:", getReadyStateString(websocket.readyState));
    }, 3000); // Check every 3 seconds
  }
  
  /**
   * Stop logging connection state
   */
  stopLogging(): void {
    if (this.connectionLogInterval) {
      clearInterval(this.connectionLogInterval);
      this.connectionLogInterval = null;
    }
  }
  
  /**
   * Log WebSocket close event
   */
  logCloseEvent(event: CloseEvent): void {
    console.log(`[ConnectionLogger] WebSocket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
    console.log("WebSocket close event details:", JSON.stringify({
      wasClean: event.wasClean,
      code: event.code,
      reason: event.reason
    }));
  }
}
