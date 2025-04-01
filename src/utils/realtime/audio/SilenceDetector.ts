
export class SilenceDetector {
  private silenceStart: number | null = null;
  private isSilent: boolean = false;
  private lastVolume: number = 0;
  private readonly silenceThreshold: number;
  private readonly silenceDuration: number;
  private readonly onSilenceDetected?: () => void;

  constructor(silenceThreshold: number = 0.01, silenceDuration: number = 1500, onSilenceDetected?: () => void) {
    this.silenceThreshold = silenceThreshold;
    this.silenceDuration = silenceDuration;
    this.onSilenceDetected = onSilenceDetected;
  }

  /**
   * Detect silence in audio data and trigger callback when silence duration threshold is met
   * @param audioData Float32Array of audio samples
   */
  detectSilence(audioData: Float32Array): void {
    // Calculate RMS volume of the audio chunk
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rmsVolume = Math.sqrt(sum / audioData.length);
    this.lastVolume = rmsVolume;
    
    const now = Date.now();
    const isSilentNow = rmsVolume < this.silenceThreshold;
    
    // Handle transition to silence
    if (!this.isSilent && isSilentNow) {
      this.isSilent = true;
      this.silenceStart = now;
      console.debug(`[SilenceDetector] Silence detected, volume: ${rmsVolume.toFixed(5)}`);
    }
    // Handle transition to sound
    else if (this.isSilent && !isSilentNow) {
      this.isSilent = false;
      this.silenceStart = null;
      console.debug(`[SilenceDetector] Sound detected, volume: ${rmsVolume.toFixed(5)}`);
    }
    
    // Check if silence has lasted long enough to trigger the callback
    if (this.isSilent && this.silenceStart && 
        (now - this.silenceStart) > this.silenceDuration && 
        this.onSilenceDetected) {
      console.log(`[SilenceDetector] Prolonged silence detected (${now - this.silenceStart}ms)`);
      this.onSilenceDetected();
      // Reset silence start to prevent multiple triggers
      this.silenceStart = null;
    }
  }

  /**
   * Reset the silence detection state
   */
  reset(): void {
    this.silenceStart = null;
    this.isSilent = false;
  }

  /**
   * Get the current silence state
   */
  getSilenceInfo(): { 
    isSilent: boolean; 
    lastVolume: number; 
    silenceDuration: number | null;
  } {
    return {
      isSilent: this.isSilent,
      lastVolume: this.lastVolume,
      silenceDuration: this.silenceStart ? Date.now() - this.silenceStart : null
    };
  }
}
