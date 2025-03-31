
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
      
      // Set the WebSocket URL and set protocols to empty array
      webSocketManager.setUrl(wsUrl);
      webSocketManager.setProtocols([]); // Don't use any protocols for maximum compatibility
      
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
    
    // Send an immediate ping to help establish connection
    try {
      websocket.send(JSON.stringify({
        type: "ping",
        timestamp: new Date().toISOString()
      }));
      console.log("[ConnectionInitializer] Sent initial ping");
    } catch (e) {
      console.warn("[ConnectionInitializer] Failed to send initial ping:", e);
    }
    
    // Set up a temporary message handler for initial messages
    websocket.onmessage = (event) => {
      try {
        console.log("[ConnectionInitializer] Initial message received:", 
          typeof event.data === 'string' ? event.data.substring(0, 100) + '...' : 'Binary data');
        
        // Try to parse as JSON to see if it's a pong response
        try {
          const data = JSON.parse(event.data);
          if (data.type === "pong" || data.type === "connection.initialized") {
            console.log("[ConnectionInitializer] Connection verified with server response");
          }
        } catch (e) {
          // Not JSON or parsing error - continue
        }
      } catch (error) {
        console.error("[ConnectionInitializer] Error handling initial message:", error);
      }
    };
  }
}
