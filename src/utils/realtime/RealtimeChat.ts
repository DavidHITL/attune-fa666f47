
import { TranscriptCallback, SessionConfig } from './types';
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
      
    } catch (error) {
      console.error("Failed to connect:", error);
      this.isConnected = false;
      throw error;
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
            break;
            
          case 'response.audio.delta':
            await this.handleAudioDelta(data.delta);
            break;
            
          case 'response.audio_transcript.delta':
            this.updateTranscript(data.delta);
            break;
            
          case 'response.audio.done':
            console.log("Audio response complete");
            this.eventEmitter.dispatchEvent('response', this.transcriptCallback.toString());
            break;
            
          case 'error':
            console.error("Error from voice service:", data.error);
            break;
            
          default:
            console.log("Received message type:", data.type);
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
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
    if (!this.audioProcessor.getAudioContext()) return;
    
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
  }
  
  /**
   * Send a message to the AI
   */
  sendMessage(message: string): void {
    if (!this.isConnected) {
      console.error("WebSocket not connected");
      return;
    }
    
    console.log("Sending message to voice service:", message);
    
    // Clear any processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
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
    this.websocketManager.send(messageEvent);
    
    // Request a response
    this.websocketManager.send({type: 'response.create'});
  }
  
  /**
   * Send speech data to the AI
   */
  sendSpeechData(audioData: Float32Array): void {
    if (!this.isConnected) return;
    
    // Convert Float32Array to base64 encoded Int16Array
    const base64Audio = this.audioProcessor.encodeAudioData(audioData);
    
    // Send audio buffer
    const audioEvent = {
      type: 'input_audio_buffer.append',
      audio: base64Audio
    };
    
    this.websocketManager.send(audioEvent);
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
