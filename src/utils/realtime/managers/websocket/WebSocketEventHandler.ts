
/**
 * Handles WebSocket events
 */
export class WebSocketEventHandler {
  /**
   * Set up connection timeout
   */
  setupConnectionTimeout(
    websocket: WebSocket, 
    promiseHandler: any, 
    timeoutMs: number
  ): number {
    return window.setTimeout(() => {
      console.error("[WebSocketEventHandler] Connection timed out");
      promiseHandler.rejectOpenPromise(new Error("Connection timeout"));
      
      if (websocket) {
        try {
          websocket.close();
        } catch (closeError) {
          console.error("[WebSocketEventHandler] Error closing WebSocket after timeout:", closeError);
        }
      }
    }, timeoutMs);
  }

  /**
   * Set up WebSocket error handlers
   */
  setupErrorHandlers(websocket: WebSocket): void {
    websocket.addEventListener('error', (event) => {
      console.error("[WebSocketEventHandler] WebSocket error event:", event);
    });
  }

  /**
   * Set up WebSocket close handlers
   */
  setupCloseHandlers(websocket: WebSocket, connectionLogger: any): void {
    websocket.addEventListener('close', (event) => {
      connectionLogger.stopLogging();
      connectionLogger.logCloseEvent(event);
    });
  }
}
