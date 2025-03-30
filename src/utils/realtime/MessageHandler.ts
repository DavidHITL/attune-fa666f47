
import { WebSocketManager } from './managers/WebSocketManager';
import { EventEmitter } from './EventEmitter';
import { ChatError, ErrorType } from './types';

/**
 * Handles sending and receiving messages
 */
export class MessageHandler {
  private websocketManager: WebSocketManager;
  private eventEmitter: EventEmitter;
  private transcriptCallback: (text: string) => void;
  private lastTranscriptUpdate: number = 0;
  private sessionEstablished: boolean = false;

  constructor(
    websocketManager: WebSocketManager,
    eventEmitter: EventEmitter,
    transcriptCallback: (text: string) => void
  ) {
    this.websocketManager = websocketManager;
    this.eventEmitter = eventEmitter;
    this.transcriptCallback = transcriptCallback;
  }

  /**
   * Set up WebSocket message handlers
   */
  setupMessageHandlers(): void {
    this.websocketManager.setMessageHandler((event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data.type);
        
        switch (data.type) {
          case 'connection.established':
            console.log("Connection established with server");
            break;
            
          case 'session.created':
            console.log("Session created successfully");
            this.sessionEstablished = true;
            this.eventEmitter.dispatchEvent('session.created', { status: "created" });
            
            // Send session configuration after session is created
            this.configureSession();
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
              this.updateTranscript(data.delta);
            }
            break;
            
          case 'response.audio.done':
            console.log("Audio response complete");
            this.eventEmitter.dispatchEvent('response', this.transcriptCallback.toString());
            break;
            
          case 'error':
            const errorMsg = data.error || "Unknown error from voice service";
            console.error("Error from voice service:", errorMsg);
            
            const chatError: ChatError = {
              type: ErrorType.SERVER,
              message: errorMsg
            };
            
            this.eventEmitter.dispatchEvent('error', chatError);
            break;
            
          default:
            console.log("Received message type:", data.type);
        }
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
   * Configure session settings after session is created
   */
  private configureSession(): void {
    if (!this.websocketManager) {
      console.error("Cannot configure session: WebSocketManager not available");
      return;
    }
    
    console.log("Configuring session with optimal settings");
    
    const sessionConfig = {
      "event_id": `event_${Date.now()}`,
      "type": "session.update",
      "session": {
        "modalities": ["text", "audio"],
        "instructions": "You are a helpful AI assistant that responds concisely and clearly.",
        "voice": "alloy",
        "input_audio_format": "pcm16",
        "output_audio_format": "pcm16",
        "input_audio_transcription": {
          "model": "whisper-1"
        },
        "turn_detection": {
          "type": "server_vad",
          "threshold": 0.5,
          "prefix_padding_ms": 300,
          "silence_duration_ms": 1000
        },
        "temperature": 0.8,
        "max_response_output_tokens": "inf"
      }   
    };
    
    this.websocketManager.send(sessionConfig);
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
    
    if (!this.sessionEstablished) {
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
    
    if (!this.sessionEstablished) {
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

  /**
   * Update transcript with new text
   */
  updateTranscript(text: string): void {
    this.lastTranscriptUpdate = Date.now();
    this.transcriptCallback(text);
  }
  
  /**
   * Check if session is established
   */
  isSessionEstablished(): boolean {
    return this.sessionEstablished;
  }
}
