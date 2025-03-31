
/**
 * Manages WebSocket connection timeouts
 */
export class WebSocketTimeoutManager {
  constructor(private promiseHandler: any) {}

  /**
   * Set up connection timeout
   */
  setupConnectionTimeout(
    websocket: WebSocket, 
    timeoutMs: number
  ): number {
    return window.setTimeout(() => {
      console.error("[WebSocketTimeoutManager] Connection timed out");
      this.promiseHandler.rejectOpenPromise(new Error("Connection timeout"));
      
      if (websocket) {
        try {
          websocket.close();
        } catch (closeError) {
          console.error("[WebSocketTimeoutManager] Error closing WebSocket after timeout:", closeError);
        }
      }
    }, timeoutMs);
  }
}
