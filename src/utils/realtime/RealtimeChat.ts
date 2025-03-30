
import { EventEmitter } from './EventEmitter';
import { ChatError, ErrorType } from './types';
import { ConnectionManager } from './ConnectionManager';
import { MessageHandler } from './MessageHandler';
import { AudioHandler } from './AudioHandler';
import { SessionManager } from './SessionManager';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main class for managing realtime chat functionality
 */
export class RealtimeChat {
  private eventEmitter: EventEmitter;
  private connectionManager: ConnectionManager;
  private messageHandler: MessageHandler;
  private audioHandler: AudioHandler;
  private sessionManager: SessionManager;
  private _isConnected: boolean = false;

  /**
   * Create a new RealtimeChat instance
   * @param transcriptCallback Function to call with updated transcript text
   */
  constructor(transcriptCallback: (text: string) => void = () => {}) {
    // Use the correct Supabase project ID
    const projectId = 'oseowhythgbqvllwonaz'; 
    console.log("[RealtimeChat] Initializing with project ID:", projectId);
    
    // Initialize event emitter
    this.eventEmitter = new EventEmitter();
    
    // Create a self-contained reconnect function for the connection manager
    const reconnect = async () => {
      try {
        console.log("[RealtimeChat] Attempting to reconnect...");
        return await this.connect();
      } catch (error) {
        console.error("[RealtimeChat] Reconnection failed:", error);
        throw error;
      }
    };
    
    // Initialize connection manager with the reconnect function
    this.connectionManager = new ConnectionManager(projectId, this.eventEmitter, reconnect);
    
    // Initialize handlers
    this.messageHandler = new MessageHandler(
      this.connectionManager.getWebSocketManager(),
      this.eventEmitter,
      transcriptCallback
    );
    
    this.audioHandler = new AudioHandler(this.eventEmitter);
    this.sessionManager = new SessionManager();
    
    // Set up error handlers
    this.setupErrorHandlers();
  }

  /**
   * Connect to the OpenAI Realtime API
   */
  async connect(): Promise<void> {
    console.log("[RealtimeChat] Connecting to server");
    
    try {
      await this.connectionManager.connect();
      this._isConnected = true;
      
      // Set up message handlers after connection is established
      this.messageHandler.setupMessageHandlers();
      
      console.log("[RealtimeChat] Connection established");
    } catch (error) {
      console.error("[RealtimeChat] Connection failed:", error);
      this._isConnected = false;
      
      const chatError: ChatError = {
        type: ErrorType.CONNECTION,
        message: "Failed to connect to chat service",
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      throw error;
    }
  }

  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void {
    console.log("[RealtimeChat] Disconnecting");
    this.connectionManager.disconnect();
    this._isConnected = false;
  }

  /**
   * Get connection status
   */
  get isConnected(): boolean {
    return this._isConnected && this.connectionManager.checkConnection();
  }

  /**
   * Send a message to the OpenAI Realtime API
   */
  sendMessage(message: string): boolean {
    return this.messageHandler.sendMessage(message);
  }

  /**
   * Send audio data to the OpenAI Realtime API
   * @param speechData Raw PCM audio data as Float32Array
   */
  sendSpeechData(speechData: Float32Array): boolean {
    // Convert to base64 for transmission
    const base64Data = this.audioHandler.encodeAudioData(speechData);
    return this.messageHandler.sendSpeechData(base64Data);
  }

  /**
   * Set up error handlers
   */
  private setupErrorHandlers(): void {
    this.eventEmitter.addEventListener('error', (error: ChatError) => {
      console.error("[RealtimeChat] Error:", error.message);
      
      if (error.type === ErrorType.CONNECTION) {
        this._isConnected = false;
        this.connectionManager.tryReconnect();
      }
    });
  }

  /**
   * Add event listener
   */
  addEventListener(event: string, listener: (data: any) => void): void {
    this.eventEmitter.addEventListener(event, listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(event: string, listener: (data: any) => void): void {
    this.eventEmitter.removeEventListener(event, listener);
  }
}
