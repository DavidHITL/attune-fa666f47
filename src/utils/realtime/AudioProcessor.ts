
/**
 * Class for processing audio data for WebRTC
 */
export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private audioStream: MediaStream | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      this.audioContext = new AudioContext();
    } catch (error) {
      console.error("[AudioProcessor] Failed to create AudioContext:", error);
    }
  }

  setAudioStream(stream: MediaStream): void {
    this.audioStream = stream;
  }

  start(): void {
    console.log("[AudioProcessor] Starting audio processing");
    // Implementation for starting audio processing
  }

  stop(): void {
    console.log("[AudioProcessor] Stopping audio processing");
    // Implementation for stopping audio processing
  }

  convertToPCM16(audioData: Float32Array): Uint8Array {
    // Convert Float32Array to PCM16 format (16-bit signed integer)
    const pcm16Data = new Int16Array(audioData.length);

    // Scale and convert the Float32Array to Int16Array
    for (let i = 0; i < audioData.length; i++) {
      // Clamp between -1 and 1
      const s = Math.max(-1, Math.min(1, audioData[i]));
      // Convert to 16-bit integer
      pcm16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Convert to Uint8Array for sending over the wire
    return new Uint8Array(pcm16Data.buffer);
  }

  cleanup(): void {
    if (this.audioContext) {
      if (this.audioContext.state !== "closed") {
        this.audioContext.close().catch(console.error);
      }
      this.audioContext = null;
    }
    this.audioStream = null;
  }
}
