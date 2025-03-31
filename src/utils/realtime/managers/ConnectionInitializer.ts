
import { EventEmitter } from '../EventEmitter';
import { IWebSocketManager } from './interfaces/IWebSocketManager';

/**
 * Handles WebSocket connection initialization
 */
export class ConnectionInitializer {
  /**
   * Initialize and establish WebSocket connection
   */
  async initializeConnection(
    projectId: string,
    webSocketManager: IWebSocketManager,
    connectionState: any,
    reconnectionHandler: any,
    eventEmitter: EventEmitter
  ): Promise<void> {
    try {
      reconnectionHandler.clearTimeout();
      
      // Build the WebSocket URL with the correct format
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
      
      console.log("[ConnectionInitializer] Initializing connection to:", wsUrl);
      console.log("[ConnectionInitializer] Project ID:", projectId);
      
      // Set the WebSocket URL and protocols
      webSocketManager.setUrl(wsUrl);
      webSocketManager.setProtocols(['json', 'openai-realtime']);
      
      // Connect to the WebSocket server
      return await webSocketManager.connect((websocket: WebSocket, timeoutId: number) => 
        this.setupConnectionHandlers(websocket, timeoutId, webSocketManager, connectionState, reconnectionHandler, eventEmitter)
      );
    } catch (error) {
      console.error("[ConnectionInitializer] Failed to connect:", error);
      connectionState.setConnected(false);
      reconnectionHandler.tryReconnect();
      
      // Dispatch error event
      eventEmitter.dispatchEvent('error', {
        type: 'connection',
        message: 'Failed to connect to WebSocket',
        error
      });
      
      throw error;
    }
  }

  /**
   * Set up initial WebSocket event handlers
   */
  private setupConnectionHandlers(
    websocket: WebSocket, 
    timeoutId: number,
    webSocketManager: any,
    connectionState: any,
    reconnectionHandler: any,
    eventEmitter: EventEmitter
  ): void {
    // This function is intentionally left empty since the actual implementation
    // is in the ConnectionEventHandler class. This is just a placeholder for
    // the callback in the connect method.
  }
}
