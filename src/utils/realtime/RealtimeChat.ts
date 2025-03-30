
import { TranscriptCallback, ChatError, ErrorType } from './types';
import { EventEmitter } from './EventEmitter';
import { ConnectionManager } from './ConnectionManager';
import { SessionManager } from './SessionManager';
import { AudioHandler } from './AudioHandler';
import { MessageHandler } from './MessageHandler';

/**
 * Main class for handling realtime chat with audio capabilities
 */
export class RealtimeChat {
  private connectionManager: ConnectionManager;
  private sessionManager: SessionManager;
  private audioHandler: AudioHandler;
  private messageHandler: MessageHandler;
  private eventEmitter: EventEmitter;
  private processingTimeout: NodeJS.Timeout | null = null;
  
  public isConnected: boolean = false;

  constructor(transcriptCallback: TranscriptCallback) {
    // Initialize components
    this.eventEmitter = new EventEmitter();
    
    // Initialize with Supabase project ID - ensure this is correct
    const projectId = 'oseowhythgbqvllwonaz'; 
    
    // Create connection manager
    this.connectionManager = new ConnectionManager(projectId, this.eventEmitter);
    
    this.sessionManager = new SessionManager();
    this.audioHandler = new AudioHandler(this.eventEmitter);
    this.messageHandler = new MessageHandler(
      this.connectionManager.getWebSocketManager(),
      this.eventEmitter, 
      transcriptCallback
    );
    
    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Set up internal event listeners
   */
  private setupEventListeners(): void {
    // Handle audio deltas
    this.eventEmitter.addEventListener('audio.delta', async (base64Audio: string) => {
      await this.audioHandler.processAudioDelta(base64Audio);
    });
    
    // Handle session creation
    this.eventEmitter.addEventListener('session.created', () => {
      this.sessionManager.configureSession(this.connectionManager.getWebSocketManager());
    });
    
    // Update connection status
    this.eventEmitter.addEventListener('connected', () => {
      this.isConnected = true;
    });
    
    this.eventEmitter.addEventListener('disconnected', () => {
      this.isConnected = false;
    });
    
    // Handle connection errors
    this.eventEmitter.addEventListener('error', (error: ChatError) => {
      console.error('RealtimeChat error event:', error);
    });
  }

  /**
   * Connect to the realtime chat service
   */
  async connect(): Promise<void> {
    try {
      console.log("RealtimeChat: Initiating connection");
      
      // Connect to WebSocket
      await this.connectionManager.connect();
      this.isConnected = this.connectionManager.checkConnection();
      
      if (this.isConnected) {
        console.log("RealtimeChat: Connection successful");
        // Set up message handlers
        this.messageHandler.setupMessageHandlers();
        
        // Initialize audio
        await this.audioHandler.initializeAudio();
      } else {
        console.error("RealtimeChat: Connection failed");
        throw new Error("Failed to establish connection");
      }
      
    } catch (error) {
      console.error("RealtimeChat: Failed to connect:", error);
      this.isConnected = false;
      throw error;
    }
  }
  
  /**
   * Send a message to the AI
   */
  sendMessage(message: string): void {
    // Clear any processing timeout
    if (this.processingTimeout) {
      clearTimeout(this.processingTimeout);
      this.processingTimeout = null;
    }
    
    // Check connection and attempt reconnect if needed
    if (!this.connectionManager.checkConnection()) {
      this.connectionManager.tryReconnect();
      return;
    }
    
    this.messageHandler.sendMessage(message);
  }
  
  /**
   * Send speech data to the AI
   */
  sendSpeechData(audioData: Float32Array): void {
    if (!audioData || audioData.length === 0) return;
    
    if (!this.connectionManager.checkConnection()) {
      return;
    }
    
    const base64Audio = this.audioHandler.encodeAudioData(audioData);
    if (base64Audio) {
      this.messageHandler.sendSpeechData(base64Audio);
    }
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
    
    this.connectionManager.disconnect();
    this.audioHandler.dispose();
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
