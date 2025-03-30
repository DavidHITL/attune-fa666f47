
import { WebSocketManager } from './WebSocketManager';
import { ConnectionState } from './ConnectionState';
import { ReconnectionHandler } from '../ReconnectionHandler';
import { EventEmitter } from '../EventEmitter';

/**
 * Handles WebSocket connection events
 */
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

  /**
   * Set up WebSocket event handlers
   */
  setupEventHandlers(websocket: WebSocket, timeoutId: number): void {
    websocket.onopen = (event) => {
      console.log("WebSocket connection established successfully", event);
      this.connectionState.setConnected(true);
      this.reconnectionHandler.resetAttempts();
      window.clearTimeout(timeoutId);
      
      this.webSocketManager.resolveOpenPromise();
      
      // Dispatch connected event
      this.eventEmitter.dispatchEvent('connected', { status: "connected" });
    };
    
    websocket.onerror = (error) => {
      console.error("WebSocket connection error:", error);
      this.connectionState.setConnected(false);
      window.clearTimeout(timeoutId);
      
      this.webSocketManager.rejectOpenPromise(error);
      
      // Dispatch error event
      this.eventEmitter.dispatchEvent('error', {
        type: 'connection',
        message: 'WebSocket connection error',
        error
      });
      
      // Gentler approach to reconnection - don't immediately discard on error
      // This will allow the onclose handler to attempt reconnection
      console.log("WebSocket error - will attempt reconnection on close event");
    };
    
    websocket.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      this.connectionState.setConnected(false);
      window.clearTimeout(timeoutId);
      
      this.webSocketManager.rejectOpenPromise(
        new Error(`Connection closed: ${event.code} ${event.reason}`)
      );
      
      // Dispatch disconnected event
      this.eventEmitter.dispatchEvent('disconnected', {
        code: event.code,
        reason: event.reason
      });
      
      // Always attempt reconnection except for normal closure
      const normalCloseCode = 1000;
      const abnormalCloseCode = 1006;
      
      if (event.code !== normalCloseCode) {
        console.log(`Abnormal close (${event.code}), attempting reconnection`);
        this.reconnectionHandler.tryReconnect();
      } else if (Number(event.code) === abnormalCloseCode) {
        // Code 1006 means abnormal closure, could be network issues
        console.log("Abnormal closure detected, attempting reconnection");
        setTimeout(() => {
          if (this.reconnectionHandler.getAttempts() < 5) {
            this.reconnectionHandler.tryReconnect();
          }
        }, 2000); // Add a small delay before reconnection attempt
      }
    };
    
    websocket.onmessage = (event) => {
      try {
        // Forward the message to any listeners
        this.eventEmitter.dispatchEvent('message', event.data);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        this.eventEmitter.dispatchEvent('error', {
          type: 'message',
          message: 'Error processing WebSocket message',
          error
        });
      }
    };
  }
}
