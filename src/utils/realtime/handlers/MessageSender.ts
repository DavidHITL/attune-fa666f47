
import { WebSocketManager } from '../managers/WebSocketManager';
import { EventEmitter } from '../EventEmitter';
import { ChatError, ErrorType } from '../types';
import { SessionHandler } from './SessionHandler';

/**
 * Handles sending messages to the WebSocket
 */
export class MessageSender {
  private websocketManager: WebSocketManager;
  private eventEmitter: EventEmitter;
  private sessionHandler: SessionHandler;

  constructor(
    websocketManager: WebSocketManager,
    eventEmitter: EventEmitter,
    sessionHandler: SessionHandler
  ) {
    this.websocketManager = websocketManager;
    this.eventEmitter = eventEmitter;
    this.sessionHandler = sessionHandler;
  }

  /**
   * Send a text message
   */
  sendMessage(message: string): boolean {
    if (!message || message.trim() === "") {
      console.warn("Attempted to send empty message");
      return false;
    }
    
    if (!this.websocketManager) {
      const errorMsg = "WebSocketManager not available";
      console.error(errorMsg);
      
      const chatError: ChatError = {
        type: ErrorType.CONNECTION,
        message: errorMsg
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      return false;
    }
    
    if (!this.sessionHandler.isSessionEstablished()) {
      console.warn("Cannot send message: Session not yet established");
      
      const chatError: ChatError = {
        type: ErrorType.CONNECTION,
        message: "Session not yet established"
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      return false;
    }
    
    console.log("Sending message to voice service:", message);
    
    // Create a conversation item with user message
    const messageEvent = {
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: message
          }
        ]
      }
    };
    
    // Send the message
    const sent = this.websocketManager.send(messageEvent);
    if (!sent) {
      return false;
    }
    
    // Request a response
    return this.websocketManager.send({type: 'response.create'});
  }

  /**
   * Send speech data
   */
  sendSpeechData(base64Audio: string): boolean {
    if (!base64Audio) {
      console.warn("Failed to encode audio data");
      return false;
    }
    
    if (!this.websocketManager) {
      console.warn("Cannot send speech data: WebSocketManager not available");
      return false;
    }
    
    if (!this.sessionHandler.isSessionEstablished()) {
      console.warn("Cannot send speech data: Session not yet established");
      return false;
    }
    
    try {
      // Send audio buffer
      const audioEvent = {
        type: 'input_audio_buffer.append',
        audio: base64Audio
      };
      
      console.log("Sending audio data chunk");
      return this.websocketManager.send(audioEvent);
    } catch (error) {
      console.error("Error sending speech data:", error);
      
      const chatError: ChatError = {
        type: ErrorType.AUDIO,
        message: "Failed to send speech data",
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      return false;
    }
  }
}
