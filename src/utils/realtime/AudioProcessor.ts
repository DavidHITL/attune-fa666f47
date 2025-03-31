
/**
 * Utility for processing and playing audio data from WebRTC connections
 */
export class AudioProcessor {
  private audioQueue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;
  private isAudioContextResumed: boolean = false;
  private currentMessageAudioBuffers: Uint8Array[] = [];

  constructor() {
    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Match OpenAI's audio sample rate
      });
      
      // Initialize audio element
      const audio = new Audio();
      audio.autoplay = false;
      this.audioElement = audio;
      
      // Create gain node for volume control
      if (this.audioContext) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0; // Default volume
        this.gainNode.connect(this.audioContext.destination);
      }
      
      console.log("[AudioProcessor] Successfully initialized audio system");
    } catch (error) {
      console.error("[AudioProcessor] Error initializing audio system:", error);
    }
  }

  /**
   * Ensure AudioContext is resumed (needed due to autoplay policy)
   */
  private ensureAudioContextResumed(): Promise<void> {
    if (!this.audioContext || this.isAudioContextResumed) {
      return Promise.resolve();
    }
    
    // Resume the audio context if it's suspended
    if (this.audioContext.state === 'suspended') {
      console.log("[AudioProcessor] Resuming audio context");
      return this.audioContext.resume()
        .then(() => {
          this.isAudioContextResumed = true;
          console.log("[AudioProcessor] AudioContext resumed successfully");
        })
        .catch(error => {
          console.error("[AudioProcessor] Failed to resume AudioContext:", error);
        });
    }
    
    this.isAudioContextResumed = true;
    return Promise.resolve();
  }

  /**
   * Add audio data to the buffer for current message
   */
  async addAudioData(base64Audio: string): Promise<void> {
    try {
      await this.ensureAudioContextResumed();
      
      // Convert base64 to binary
      const binaryData = this.decodeBase64Audio(base64Audio);
      
      // Add to current message buffer
      this.currentMessageAudioBuffers.push(binaryData);
      console.log("[AudioProcessor] Added audio chunk to current message buffer, chunks:", this.currentMessageAudioBuffers.length);
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
      if (this.currentMessageAudioBuffers.length === 0) {
        console.log("[AudioProcessor] No audio chunks to finalize");
        return;
      }

      // Combine all chunks into one PCM buffer
      const totalLength = this.currentMessageAudioBuffers.reduce((sum, chunk) => sum + chunk.length, 0);
      const combinedPcm = new Uint8Array(totalLength);
      
      let offset = 0;
      for (const chunk of this.currentMessageAudioBuffers) {
        combinedPcm.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Create WAV data with proper headers
      const wavData = this.createWavFromPCM(combinedPcm);
      
      // Add to playback queue
      this.audioQueue.push(wavData);
      console.log("[AudioProcessor] Added complete audio message to queue, length:", this.audioQueue.length);
      
      // Reset current message buffer
      this.currentMessageAudioBuffers = [];
      
      // Start playing if not already playing
      if (!this.isPlaying) {
        this.playNextAudioChunk();
      }
    } catch (error) {
      console.error("[AudioProcessor] Error finalizing audio message:", error);
      // Reset current message buffer even on error
      this.currentMessageAudioBuffers = [];
    }
  }

  /**
   * Decode base64 audio to binary data
   */
  private decodeBase64Audio(base64Audio: string): Uint8Array {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      console.error("[AudioProcessor] Error decoding base64 audio:", error);
      return new Uint8Array(0);
    }
  }

  /**
   * Play the next audio chunk in the queue
   */
  private playNextAudioChunk(): void {
    if (this.audioQueue.length === 0) {
      this.isPlaying = false;
      return;
    }

    this.isPlaying = true;
    const wavData = this.audioQueue.shift()!;

    try {
      // Create blob URL for the audio element
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      if (this.audioElement) {
        // Set up event listener for when playback ends
        const handleEnded = () => {
          URL.revokeObjectURL(url);
          this.audioElement?.removeEventListener('ended', handleEnded);
          // Continue with next chunk
          this.playNextAudioChunk();
        };
        
        // Set up error handling
        const handleError = (err: Event) => {
          console.error("[AudioProcessor] Error playing audio:", err);
          this.audioElement?.removeEventListener('error', handleError);
          // Continue with next chunk even if this one fails
          handleEnded();
        };
        
        this.audioElement.addEventListener('ended', handleEnded);
        this.audioElement.addEventListener('error', handleError);
        
        // Start playback
        this.audioElement.src = url;
        this.audioElement.play().catch(err => {
          console.error("[AudioProcessor] Error playing audio:", err);
          handleEnded(); // Continue with next chunk even if this one fails
        });
      }
    } catch (error) {
      console.error("[AudioProcessor] Error playing audio chunk:", error);
      // Continue with next chunk even if this one fails
      this.playNextAudioChunk();
    }
  }

  /**
   * Create WAV format from PCM data
   */
  private createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // PCM data is 16-bit samples, little-endian
    const numSamples = pcmData.length / 2;
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;
    
    // Create buffer for WAV header + data
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk
    this.writeString(view, 0, "RIFF");
    view.setUint32(4, fileSize, true);
    this.writeString(view, 8, "WAVE");
    
    // "fmt " chunk
    this.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" chunk
    this.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
    
    // Copy PCM data
    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(pcmData);
    
    return new Uint8Array(buffer);
  }

  /**
   * Helper function to write strings to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Set the volume for audio playback
   * @param value Volume level from 0 to 1
   */
  setVolume(value: number): void {
    if (this.gainNode) {
      const safeValue = Math.max(0, Math.min(1, value));
      this.gainNode.gain.value = safeValue;
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error("[AudioProcessor] Error closing AudioContext:", err);
      });
      this.audioContext = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.audioQueue = [];
    this.currentMessageAudioBuffers = [];
    this.isPlaying = false;
    this.isAudioContextResumed = false;
  }
}
