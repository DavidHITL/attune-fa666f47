
import { WebSocketManager } from './WebSocketManager';
import { ConnectionState } from './ConnectionState';
import { ReconnectionHandler } from '../ReconnectionHandler';
import { EventEmitter } from '../EventEmitter';

export class ConnectionEventHandler {
  private webSocketManager: WebSocketManager;
  private connectionState: ConnectionState;
  private reconnectionHandler: ReconnectionHandler;
  private eventEmitter: EventEmitter;
  
  constructor(
    webSocketManager: WebSocketManager,
    connectionState: ConnectionState,
    reconnectionHandler: ReconnectionHandler,
    eventEmitter: EventEmitter
  ) {
    this.webSocketManager = webSocketManager;
    this.connectionState = connectionState;
    this.reconnectionHandler = reconnectionHandler;
    this.eventEmitter = eventEmitter;
  }

  setupEventHandlers(websocket: WebSocket, timeoutId: number): void {
    console.log("[ConnectionEventHandler] Setting up WebSocket event handlers");
    
    websocket.onopen = (event: Event) => {
      console.log("[ConnectionEventHandler] WebSocket connection opened", event);
      
      // Clear connection timeout
      window.clearTimeout(timeoutId);
      
      // Mark connection as successful
      this.connectionState.setConnected(true);
      this.connectionState.setConnecting(false);
      
      // Resolve the connection promise
      this.webSocketManager.resolveOpenPromise();
      
      // Reset reconnection attempt counter
      this.reconnectionHandler.resetAttempts();
      
      // Dispatch connection event
      this.eventEmitter.dispatchEvent('connection', { 
        status: "connected",
        timestamp: new Date()
      });
    };
    
    websocket.onclose = (event: CloseEvent) => {
      console.log("[ConnectionEventHandler] WebSocket connection closed", event);
      this.handleDisconnect(event, "closed");
    };
    
    websocket.onerror = (event: Event) => {
      console.error("[ConnectionEventHandler] WebSocket connection error", event);
      // Will be followed by onclose, so don't handle disconnect here
      
      // Dispatch error event
      this.eventEmitter.dispatchEvent('error', {
        type: 'connection',
        message: 'WebSocket error occurred',
        error: event
      });
    };
    
    // Message handler is set up by the MessageHandler class
  }
  
  private handleDisconnect(event: Event, reason: string): void {
    // Update connection state
    this.connectionState.setConnected(false);
    this.connectionState.setConnecting(false);
    
    // Attempt reconnection
    if (this.connectionState.shouldTryReconnect()) {
      console.log("[ConnectionEventHandler] Attempting to reconnect...");
      this.reconnectionHandler.tryReconnect();
    }
    
    // Dispatch disconnection event
    this.eventEmitter.dispatchEvent('disconnection', { 
      status: "disconnected",
      reason: reason,
      timestamp: new Date()
    });
  }
}
