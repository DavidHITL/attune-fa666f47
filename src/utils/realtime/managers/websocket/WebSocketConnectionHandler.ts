
import { ConnectionLogger } from '../ConnectionLogger';
import { WebSocketManager } from './WebSocketManager';

/**
 * Handles WebSocket connection management
 */
export class WebSocketConnectionHandler {
  /**
   * Setup connection event handlers
   */
  setupEventHandlers(websocket: WebSocket, connectionLogger: ConnectionLogger): void {
    this.setupErrorHandlers(websocket);
    this.setupCloseHandlers(websocket, connectionLogger);
  }

  /**
   * Handle connection attempts counting and reset
   */
  handleConnectionAttempt(webSocketManager: WebSocketManager): void {
    // Reset connection counter if it's maxed out
    if (webSocketManager.getConnectionAttempt() >= webSocketManager.getMaxConnectionAttempts()) {
      webSocketManager.setConnectionAttempt(0);
    }
    
    // Increment connection attempt
    const currentAttempt = webSocketManager.getConnectionAttempt() + 1;
    webSocketManager.setConnectionAttempt(currentAttempt);
    console.log(`[WebSocketConnectionHandler] Connection attempt ${currentAttempt} of ${webSocketManager.getMaxConnectionAttempts()}`);
  }

  /**
   * Set up WebSocket error handlers
   */
  private setupErrorHandlers(websocket: WebSocket): void {
    websocket.addEventListener('error', (event) => {
      console.error("[WebSocketConnectionHandler] WebSocket error event:", event);
    });
  }

  /**
   * Set up WebSocket close handlers
   */
  private setupCloseHandlers(websocket: WebSocket, connectionLogger: ConnectionLogger): void {
    websocket.addEventListener('close', (event) => {
      connectionLogger.stopLogging();
      connectionLogger.logCloseEvent(event);
    });
  }
}
