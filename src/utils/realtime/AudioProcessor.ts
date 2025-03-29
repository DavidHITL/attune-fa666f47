
import { AudioChunk } from './types';

export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private audioQueue: AudioChunk[] = [];
  private isPlayingAudio: boolean = false;

  constructor(sampleRate: number = 24000) {
    try {
      this.audioContext = new AudioContext({ sampleRate });
    } catch (error) {
      console.error("Failed to initialize AudioContext:", error);
    }
  }

  /**
   * Create audio data from PCM16 format
   */
  createAudioFromPCM16(pcmData: Uint8Array): AudioBuffer {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }
    
    // Convert bytes to samples
    const samples = pcmData.length / 2;
    const audioBuffer = this.audioContext.createBuffer(1, samples, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    // PCM16 is signed 16-bit little-endian
    for (let i = 0; i < samples; i++) {
      const idx = i * 2;
      const sample = (pcmData[idx] | (pcmData[idx + 1] << 8)) / 32768.0;
      channelData[i] = sample;
    }
    
    return audioBuffer;
  }
  
  /**
   * Queue audio for sequential playback
   */
  async queueAudioForPlayback(audioBuffer: AudioBuffer): Promise<void> {
    this.audioQueue.push({ buffer: audioBuffer });
    
    if (!this.isPlayingAudio) {
      this.playNextAudioChunk();
    }
  }
  
  /**
   * Play the next chunk in the queue
   */
  private playNextAudioChunk(): void {
    if (this.audioQueue.length === 0) {
      this.isPlayingAudio = false;
      return;
    }
    
    this.isPlayingAudio = true;
    const chunk = this.audioQueue.shift();
    
    if (chunk && this.audioContext) {
      const source = this.audioContext.createBufferSource();
      source.buffer = chunk.buffer;
      source.connect(this.audioContext.destination);
      
      source.onended = () => {
        this.playNextAudioChunk();
      };
      
      source.start(0);
    }
  }
  
  /**
   * Encode audio data for API
   */
  encodeAudioData(float32Array: Float32Array): string {
    // Convert to Int16Array (PCM 16-bit format)
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to binary string
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Return as base64
    return btoa(binary);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioQueue = [];
    this.isPlayingAudio = false;
  }

  /**
   * Get the current AudioContext
   */
  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}
