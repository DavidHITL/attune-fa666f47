
import { EventEmitter } from './EventEmitter';
import { DirectConnectionManager } from './connection/DirectConnectionManager';
import { RealtimeEvent, TokenResponse } from './types/events';

/**
 * Establishes and manages a direct connection to OpenAI's realtime API
 */
export class DirectOpenAIConnection {
  private eventEmitter = new EventEmitter();
  private connectionManager: DirectConnectionManager;
  
  constructor() {
    this.connectionManager = new DirectConnectionManager(this.eventEmitter);
  }

  /**
   * Connect to OpenAI's Realtime API using WebRTC
   */
  async connect(
    instructions = "You are a helpful AI assistant.",
    voice = "alloy"
  ): Promise<void> {
    console.log("[DirectOpenAI] Initiating connection");
    return this.connectionManager.connect(instructions, voice);
  }

  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string): boolean {
    return this.connectionManager.sendTextMessage(text);
  }

  /**
   * Send audio data to OpenAI
   */
  sendAudioData(audioData: Float32Array): boolean {
    return this.connectionManager.sendAudioData(audioData);
  }

  /**
   * Disconnect from OpenAI
   */
  disconnect(): void {
    this.connectionManager.disconnect();
  }

  /**
   * Check if connected to OpenAI
   */
  isConnectedToOpenAI(): boolean {
    return this.connectionManager.isConnectedToOpenAI();
  }

  /**
   * Add event listener for DirectOpenAI events
   */
  addEventListener(
    callback: (event: RealtimeEvent) => void
  ): () => void {
    const eventHandler = this.eventEmitter.addEventListener('event', callback);
    
    // Return unsubscribe function
    return () => {
      this.eventEmitter.removeEventListener('event', eventHandler);
    };
  }
}

// Re-export types
export type { AudioDataEvent, TranscriptEvent, ConnectionStateEvent, RealtimeEvent, TokenResponse } from './types/events';
