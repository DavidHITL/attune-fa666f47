
import { EventEmitter } from '../EventEmitter';
import { ChatError, ErrorType } from '../types';
import { TranscriptHandler } from './TranscriptHandler';
import { SessionHandler } from './SessionHandler';
import { WebSocketManager } from '../managers/WebSocketManager';

/**
 * Processes incoming WebSocket messages
 */
export class MessageProcessor {
  private eventEmitter: EventEmitter;
  private transcriptHandler: TranscriptHandler;
  private sessionHandler: SessionHandler;
  private websocketManager: WebSocketManager;

  constructor(
    eventEmitter: EventEmitter,
    transcriptHandler: TranscriptHandler,
    sessionHandler: SessionHandler,
    websocketManager: WebSocketManager
  ) {
    this.eventEmitter = eventEmitter;
    this.transcriptHandler = transcriptHandler;
    this.sessionHandler = sessionHandler;
    this.websocketManager = websocketManager;
  }

  /**
   * Process a WebSocket message
   */
  processMessage(data: any): void {
    console.log("Received WebSocket message:", data.type);
    
    switch (data.type) {
      case 'connection.established':
        console.log("Connection established with server");
        break;
        
      case 'session.created':
        console.log("Session created successfully");
        this.sessionHandler.setSessionEstablished();
        
        // Send session configuration after session is created
        this.sessionHandler.configureSession(this.websocketManager);
        break;
        
      case 'session.updated':
        console.log("Session configuration updated", data);
        break;
        
      case 'response.audio.delta':
        if (data.delta) {
          this.eventEmitter.dispatchEvent('audio.delta', data.delta);
        }
        break;
        
      case 'response.audio_transcript.delta':
        if (data.delta) {
          this.transcriptHandler.updateTranscript(data.delta);
        }
        break;
        
      case 'response.audio.done':
        console.log("Audio response complete");
        this.eventEmitter.dispatchEvent('response', this.transcriptHandler.getLastUpdateTime());
        break;
        
      case 'error':
        this.handleError(data);
        break;
        
      default:
        console.log("Received message type:", data.type);
    }
  }

  /**
   * Handle error messages from the server
   */
  private handleError(data: any): void {
    const errorMsg = data.error || "Unknown error from voice service";
    console.error("Error from voice service:", errorMsg);
    
    const chatError: ChatError = {
      type: ErrorType.SERVER,
      message: errorMsg
    };
    
    this.eventEmitter.dispatchEvent('error', chatError);
  }
}
