
/**
 * Utility class for detecting silence in audio streams
 * Used to determine when a user has stopped speaking
 */
export class SilenceDetector {
  private silenceFrames: number = 0;
  private readonly silenceThreshold: number;
  private readonly silenceDurationThreshold: number;
  private onSilenceDetectedCallback: (() => void) | null = null;

  /**
   * Create a new SilenceDetector
   * @param silenceThreshold RMS threshold below which audio is considered silence (0.0 to 1.0)
   * @param silenceDurationFrames Number of consecutive silent frames before silence is detected
   * @param onSilenceDetected Callback to execute when silence duration is exceeded
   */
  constructor(
    silenceThreshold: number = 0.01, 
    silenceDurationFrames: number = 15,
    onSilenceDetected?: () => void
  ) {
    this.silenceThreshold = silenceThreshold;
    this.silenceDurationThreshold = silenceDurationFrames;
    
    if (onSilenceDetected) {
      this.onSilenceDetectedCallback = onSilenceDetected;
    }
  }

  /**
   * Check if the given audio data is silence
   * @param audioData Audio data to check
   * @returns True if the audio is silence, false otherwise
   */
  isSilence(audioData: Float32Array): boolean {
    // Calculate RMS (Root Mean Square) of the audio data
    let sum = 0;
    for (let i = 0; i < audioData.length; i++) {
      sum += audioData[i] * audioData[i];
    }
    const rms = Math.sqrt(sum / audioData.length);
    
    // If RMS is below threshold, it's considered silence
    return rms < this.silenceThreshold;
  }

  /**
   * Increment the consecutive silence frames counter
   */
  incrementSilenceFrames(): void {
    this.silenceFrames++;
  }

  /**
   * Reset the consecutive silence frames counter
   */
  resetSilenceFrames(): void {
    this.silenceFrames = 0;
  }

  /**
   * Check if the silence duration threshold has been exceeded
   * @returns True if silence has been detected for longer than the threshold
   */
  isSilenceDurationExceeded(): boolean {
    return this.silenceFrames >= this.silenceDurationThreshold;
  }

  /**
   * Get the current silence frames count
   * @returns Number of consecutive silence frames
   */
  getSilenceFrames(): number {
    return this.silenceFrames;
  }

  /**
   * Reset the silence detector state
   */
  reset(): void {
    this.silenceFrames = 0;
  }

  /**
   * Trigger the silence detected callback
   */
  onSilenceDetected(): void {
    if (this.onSilenceDetectedCallback) {
      this.onSilenceDetectedCallback();
    }
  }

  /**
   * Set the callback to execute when silence is detected
   * @param callback The callback function
   */
  setOnSilenceDetected(callback: () => void): void {
    this.onSilenceDetectedCallback = callback;
  }
}
