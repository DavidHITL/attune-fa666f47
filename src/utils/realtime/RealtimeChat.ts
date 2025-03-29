
import { TranscriptCallback, SessionConfig, ErrorType, ChatError } from './types';
import { AudioProcessor } from './AudioProcessor';
import { EventEmitter } from './EventEmitter';
import { WebSocketManager } from './WebSocketManager';

/**
 * Main class for handling realtime chat with audio capabilities
 */
export class RealtimeChat {
  private websocketManager: WebSocketManager;
  private audioProcessor: AudioProcessor;
  private eventEmitter: EventEmitter;
  private transcriptCallback: TranscriptCallback;
  private lastTranscriptUpdate: number = 0;
  private processingTimeout: NodeJS.Timeout | null = null;
  private reconnecting: boolean = false;
  
  public isConnected: boolean = false;

  constructor(transcriptCallback: TranscriptCallback) {
    this.transcriptCallback = transcriptCallback;
    this.eventEmitter = new EventEmitter();
    this.audioProcessor = new AudioProcessor();
    
    // Initialize WebSocket manager with Supabase project ID
    const projectId = 'oseowhythgbqvllwonaz'; // Your Supabase project ID
    this.websocketManager = new WebSocketManager(projectId);
  }

  /**
   * Connect to the realtime chat service
   */
  async connect(): Promise<void> {
    try {
      console.log("Connecting to voice service...");
      
      // Connect to WebSocket
      await this.websocketManager.connect();
      this.isConnected = this.websocketManager.isConnected;
      
      // Set up event handlers
      this.setupWebSocketHandlers();
      
      // Check audio context and attempt to resume it
      await this.audioProcessor.resumeAudioContext();
      
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      
      const chatError: ChatError = {
        type: ErrorType.CONNECTION,
        message: "Failed to connect to voice service",
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      throw chatError;
    }
  }
  
  /**
   * Setup WebSocket event handlers
   */
  private setupWebSocketHandlers(): void {
    this.websocketManager.setMessageHandler(async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data.type);
        
        switch (data.type) {
          case 'session.created':
            console.log("Session created successfully");
            // Configure session after creation
            this.configureSession();
            this.eventEmitter.dispatchEvent('connected', { status: "connected" });
            break;
            
          case 'response.audio.delta':
            if (data.delta) {
              await this.handleAudioDelta(data.delta);
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
   * Configure session settings after connection
   */
  private configureSession(): void {
    const sessionConfig: SessionConfig = {
      "event_id": "config_event",
      "type": "session.update",
      "session": {
        "modalities": ["text", "audio"],
        "instructions": "You are a helpful voice assistant that speaks naturally with users. Keep responses concise and conversational.",
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
        "max_response_output_tokens": 150
      }
    };
    
    this.websocketManager.configureSession(sessionConfig);
  }
  
  /**
   * For handling audio data chunks
   */
  private async handleAudioDelta(base64Audio: string): Promise<void> {
    if (!base64Audio || base64Audio.trim() === "") {
      console.warn("Received empty audio data");
      return;
    }
    
    try {
      if (!this.audioProcessor.getAudioContext()) {
        await this.audioProcessor.resumeAudioContext();
        if (!this.audioProcessor.getAudioContext()) {
          throw new Error("Could not initialize AudioContext");
        }
      }
      
      // Convert base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create audio data for PCM16
      const audioData = this.audioProcessor.createAudioFromPCM16(bytes);
      
      // Play audio
      await this.audioProcessor.queueAudioForPlayback(audioData);
    } catch (error) {
      console.error("Error handling audio data:", error);
      
      const chatError: ChatError = {
        type: ErrorType.AUDIO,
        message: "Failed to process audio data",
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
    }
  }
  
  /**
   * Send a message to the AI
   */
  sendMessage(message: string): void {
    if (!message || message.trim() === "") {
      console.warn("Attempted to send empty message");
      return;
    }
    
    if (!this.isConnected || !this.websocketManager.checkConnection()) {
      const errorMsg = "WebSocket not connected";
      console.error(errorMsg);
      
      const chatError: ChatError = {
        type: ErrorType.CONNECTION,
        message: errorMsg
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      
      // Try to reconnect
      if (!this.reconnecting) {
        this.reconnecting = true;
        this.connect().finally(() => {
          this.reconnecting = false;
        });
      }
      return;
    }
    
    console.log("Sending message to voice service:", message);
    
    // Clear any processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
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
    if (!this.websocketManager.send(messageEvent)) {
      return; // Send failed, error handled in WebSocketManager
    }
    
    // Request a response
    this.websocketManager.send({type: 'response.create'});
  }
  
  /**
   * Send speech data to the AI
   */
  sendSpeechData(audioData: Float32Array): void {
    if (!audioData || audioData.length === 0) return;
    
    if (!this.isConnected || !this.websocketManager.checkConnection()) {
      console.warn("Cannot send speech data: WebSocket not connected");
      return;
    }
    
    try {
      // Convert Float32Array to base64 encoded Int16Array
      const base64Audio = this.audioProcessor.encodeAudioData(audioData);
      
      if (!base64Audio) {
        console.warn("Failed to encode audio data");
        return;
      }
      
      // Send audio buffer
      const audioEvent = {
        type: 'input_audio_buffer.append',
        audio: base64Audio
      };
      
      this.websocketManager.send(audioEvent);
    } catch (error) {
      console.error("Error sending speech data:", error);
      
      const chatError: ChatError = {
        type: ErrorType.AUDIO,
        message: "Failed to send speech data",
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
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
   * Disconnect from the realtime chat service
   */
  disconnect(): void {
    console.log("Disconnecting from voice service");
    
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    this.websocketManager.disconnect();
    this.audioProcessor.dispose();
    this.eventEmitter.removeAllEventListeners();
    
    this.isConnected = false;
  }

  /**
   * Register an event listener
   */
  addEventListener(eventName: string, callback: Function): void {
    this.eventEmitter.addEventListener(eventName, callback);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(eventName: string, callback: Function): void {
    this.eventEmitter.removeEventListener(eventName, callback);
  }
}
