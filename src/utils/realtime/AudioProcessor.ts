
/**
 * Utility for processing and playing audio data from WebRTC connections
 */
export class AudioProcessor {
  private audioQueue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  private audioElement: HTMLAudioElement | null = null;

  constructor() {
    // Initialize audio element
    const audio = new Audio();
    audio.autoplay = false;
    this.audioElement = audio;
  }

  /**
   * Add audio data to the playback queue
   */
  addAudioData(base64Audio: string): void {
    try {
      // Convert base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Add to audio queue
      this.audioQueue.push(bytes);
      
      // Start playing if not already playing
      if (!this.isPlaying) {
        this.playNextAudioChunk();
      }
    } catch (error) {
      console.error("[AudioProcessor] Error processing audio:", error);
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
    const audioData = this.audioQueue.shift()!;

    try {
      // Convert PCM audio to WAV format
      const wavData = this.createWavFromPCM(audioData);
      
      // Create blob URL for the audio element
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      if (this.audioElement) {
        // Set up event listener for when playback ends
        const handleEnded = () => {
          URL.revokeObjectURL(url);
          this.audioElement?.removeEventListener('ended', handleEnded);
          this.playNextAudioChunk();
        };
        
        this.audioElement.addEventListener('ended', handleEnded);
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
   * Clean up resources
   */
  cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
  }
}
