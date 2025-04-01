
import { AudioPlaybackManager } from "./audio/AudioPlaybackManager";
import { AudioFormatConverter } from "./audio/AudioFormatConverter";
import { AudioMessageBuffer } from "./audio/AudioMessageBuffer";

/**
 * Utility for processing and playing audio data from WebRTC connections
 */
export class AudioProcessor {
  private playbackManager: AudioPlaybackManager;
  private currentMessageBuffer: AudioMessageBuffer;
  
  // New property to support direct WebRTC media track playback
  setAudioStream: ((stream: MediaStream) => void) | null = null;

  constructor() {
    this.playbackManager = new AudioPlaybackManager();
    this.currentMessageBuffer = new AudioMessageBuffer();
    console.log("[AudioProcessor] Successfully initialized");
  }

  /**
   * Add audio data to the buffer for current message
   */
  async addAudioData(base64Audio: string): Promise<void> {
    try {
      await this.playbackManager.ensureAudioContextResumed();
      
      // Empty string means we're just testing AudioContext resumption
      if (!base64Audio) return;
      
      // Convert base64 to binary
      const binaryData = AudioFormatConverter.decodeBase64Audio(base64Audio);
      
      // Add to current message buffer
      this.currentMessageBuffer.addChunk(binaryData);
      console.log("[AudioProcessor] Added audio chunk to current message buffer, chunks:", this.currentMessageBuffer.getSize());
    } catch (error) {
      console.error("[AudioProcessor] Error processing audio:", error);
    }
  }

  /**
   * Finalize the audio processing and prepare for playback
   */
  async completeAudioMessage(): Promise<void> {
    try {
      // If there are no chunks, do nothing
      if (this.currentMessageBuffer.getSize() === 0) {
        console.log("[AudioProcessor] No audio chunks to finalize");
        return;
      }

      // Combine all chunks into one PCM buffer
      const combinedPcm = this.currentMessageBuffer.combineChunks();
      
      // Create WAV data with proper headers
      const wavData = AudioFormatConverter.createWavFromPCM(combinedPcm);
      
      // Add to playback queue
      this.playbackManager.addToPlaybackQueue(wavData);
      
      // Reset current message buffer
      this.currentMessageBuffer.clear();
      
      // Start playing if not already playing
      await this.playbackManager.ensureAudioContextResumed();
      this.playbackManager.startPlayback();
    } catch (error) {
      console.error("[AudioProcessor] Error finalizing audio message:", error);
      // Reset current message buffer even on error
      this.currentMessageBuffer.clear();
    }
  }

  /**
   * Set the volume for audio playback
   * @param value Volume level from 0 to 1
   */
  setVolume(value: number): void {
    this.playbackManager.setVolume(value);
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.playbackManager.cleanup();
    this.currentMessageBuffer.clear();
  }
}
