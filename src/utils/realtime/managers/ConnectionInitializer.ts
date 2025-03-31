
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
      // Don't append any query parameters here - they will be added by the auth handler if needed
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
      
      console.log("[ConnectionInitializer] Initializing connection to:", wsUrl);
      console.log("[ConnectionInitializer] Project ID:", projectId);
      
      // Set the WebSocket URL and protocols - use a more limited set of protocols 
      // since some might not be supported by the server
      webSocketManager.setUrl(wsUrl);
      webSocketManager.setProtocols(['json']); // Simplified protocols to improve compatibility
      
      // Connect to the WebSocket server with increased timeout
      return await webSocketManager.connect((websocket: WebSocket, timeoutId: number) => 
        this.setupConnectionHandlers(websocket, timeoutId, webSocketManager, connectionState, reconnectionHandler, eventEmitter)
      );
    } catch (error) {
      console.error("[ConnectionInitializer] Failed to connect:", error);
      connectionState.setConnected(false);
      reconnectionHandler.tryReconnect();
      
      // Dispatch error event with more detailed information
      eventEmitter.dispatchEvent('error', {
        type: 'connection',
        message: 'Failed to connect to WebSocket',
        originalError: error instanceof Error ? error.message : String(error),
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
    console.log("[ConnectionInitializer] Setting up connection handlers");
    
    // This is intentionally left as a placeholder as the actual implementation
    // is in the ConnectionEventHandler class. But we'll add a message handler here
    // to help with debugging.
    
    const originalMessageHandler = websocket.onmessage;
    websocket.onmessage = (event) => {
      try {
        // Log the first message received for debugging
        console.log("[ConnectionInitializer] First message received:", typeof event.data === 'string' ? event.data.substring(0, 100) + '...' : 'Binary data');
        
        // Forward to the original handler if it exists
        if (originalMessageHandler) {
          originalMessageHandler.call(websocket, event);
        }
        
        // Only handle the first message, then restore the original handler
        websocket.onmessage = originalMessageHandler;
      } catch (error) {
        console.error("[ConnectionInitializer] Error handling initial message:", error);
      }
    };
  }
}
