
import { WebSocketManager } from './websocket/WebSocketManager';
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
    
    // Listen for reconnect events from WebSocketManager
    window.addEventListener('websocket-reconnect-needed', () => {
      console.log("[ConnectionEventHandler] Received reconnection request from WebSocketManager");
      this.connectionState.setConnected(false);
      this.connectionState.setConnecting(false);
      this.reconnectionHandler.tryReconnect();
    });
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
      
      // Start heartbeat mechanism
      this.webSocketManager.startHeartbeat();
      
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
    
    // Message handler is set up by the MessageHandler class, but we'll add pong handling here
    const originalOnMessage = websocket.onmessage;
    websocket.onmessage = (event: MessageEvent) => {
      try {
        // Check if it's a pong message
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.type === 'pong') {
            this.webSocketManager.handlePong();
            return; // Don't forward pong messages to the application
          }
        }
        
        // Forward the message to the original handler if it exists
        if (originalOnMessage) {
          originalOnMessage.call(websocket, event);
        }
      } catch (error) {
        console.error("[ConnectionEventHandler] Error processing message:", error);
      }
    };
  }
  
  private handleDisconnect(event: Event, reason: string): void {
    // Stop heartbeat on disconnect
    this.webSocketManager.stopHeartbeat();
    
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
