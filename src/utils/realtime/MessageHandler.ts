
import { WebSocketManager } from './managers/websocket/WebSocketManager';
import { EventEmitter } from './EventEmitter';
import { ChatError, ErrorType } from './types';
import { TranscriptHandler } from './handlers/TranscriptHandler';
import { SessionHandler } from './handlers/SessionHandler';
import { MessageSender } from './handlers/MessageSender';
import { MessageProcessor } from './handlers/MessageProcessor';

/**
 * Handles sending and receiving messages
 */
export class MessageHandler {
  private websocketManager: WebSocketManager;
  private eventEmitter: EventEmitter;
  private transcriptHandler: TranscriptHandler;
  private sessionHandler: SessionHandler;
  private messageSender: MessageSender;
  private messageProcessor: MessageProcessor;

  constructor(
    websocketManager: WebSocketManager,
    eventEmitter: EventEmitter,
    transcriptCallback: (text: string) => void
  ) {
    this.websocketManager = websocketManager;
    this.eventEmitter = eventEmitter;
    this.transcriptHandler = new TranscriptHandler(transcriptCallback);
    this.sessionHandler = new SessionHandler(eventEmitter);
    this.messageSender = new MessageSender(websocketManager, eventEmitter, this.sessionHandler);
    this.messageProcessor = new MessageProcessor(
      eventEmitter, 
      this.transcriptHandler, 
      this.sessionHandler,
      websocketManager
    );
  }

  /**
   * Set up WebSocket message handlers
   */
  setupMessageHandlers(): void {
    this.websocketManager.setMessageHandler((event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageProcessor.processMessage(data);
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
        
        const chatError: ChatError = {
          type: ErrorType.MESSAGE,
          message: "Failed to process WebSocket message",
          originalError: error instanceof Error ? error : new Error(String(error))
        };
        
        this.eventEmitter.dispatchEvent('error', chatError);
      }
    });
  }

  /**
   * Send a text message
   */
  sendMessage(message: string): boolean {
    return this.messageSender.sendMessage(message);
  }

  /**
   * Send speech data
   */
  sendSpeechData(base64Audio: string): boolean {
    return this.messageSender.sendSpeechData(base64Audio);
  }

  /**
   * Update transcript with new text
   */
  updateTranscript(text: string): void {
    this.transcriptHandler.updateTranscript(text);
  }
  
  /**
   * Check if session is established
   */
  isSessionEstablished(): boolean {
    return this.sessionHandler.isSessionEstablished();
  }
}
