
/**
 * Utility class for detecting silence in audio streams
 * Used to determine when a user has stopped speaking
 */
export class SilenceDetector {
  private silenceFrames: number = 0;
  private silenceThreshold: number;
  private silenceDurationThreshold: number;
  private onSilenceDetectedCallback: (() => void) | null = null;
  private lastRmsValue: number = 0;

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
    
    // Store the last RMS value for debugging
    this.lastRmsValue = rms;
    
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
   * Get the last measured RMS value
   * @returns Last RMS value from audio processing
   */
  getLastRmsValue(): number {
    return this.lastRmsValue;
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
      console.log(`[SilenceDetector] Silence detected after ${this.silenceFrames} frames, RMS: ${this.lastRmsValue}`);
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
  
  /**
   * Adjust the silence threshold
   * @param newThreshold New threshold value between 0.0 and 1.0
   */
  setSilenceThreshold(newThreshold: number): void {
    if (newThreshold >= 0 && newThreshold <= 1) {
      this.silenceThreshold = newThreshold;
    }
  }
  
  /**
   * Adjust the silence duration threshold
   * @param newDurationFrames New number of frames for silence duration
   */
  setSilenceDurationThreshold(newDurationFrames: number): void {
    if (newDurationFrames > 0) {
      this.silenceDurationThreshold = newDurationFrames;
    }
  }
}
