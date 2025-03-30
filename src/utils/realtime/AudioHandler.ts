
import { AudioProcessor } from './AudioProcessor';
import { EventEmitter } from './EventEmitter';
import { ChatError, ErrorType } from './types';

/**
 * Handles audio processing for voice chat
 */
export class AudioHandler {
  private audioProcessor: AudioProcessor;
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.audioProcessor = new AudioProcessor();
    this.eventEmitter = eventEmitter;
  }

  /**
   * Initialize and resume audio context
   */
  async initializeAudio(): Promise<boolean> {
    try {
      return await this.audioProcessor.resumeAudioContext();
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      
      const chatError: ChatError = {
        type: ErrorType.AUDIO,
        message: "Failed to initialize audio",
        originalError: error instanceof Error ? error : new Error(String(error))
      };
      
      this.eventEmitter.dispatchEvent('error', chatError);
      return false;
    }
  }

  /**
   * Process incoming audio data
   */
  async processAudioDelta(base64Audio: string): Promise<void> {
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
   * Encode and prepare speech data for sending
   */
  encodeAudioData(audioData: Float32Array): string | null {
    try {
      return this.audioProcessor.encodeAudioData(audioData);
    } catch (error) {
      console.error("Error encoding audio data:", error);
      return null;
    }
  }

  /**
   * Clean up audio resources
   */
  dispose(): void {
    this.audioProcessor.dispose();
  }
}
