
/**
 * Utility class to manage AudioContext creation and cleanup
 */
export class AudioContextManager {
  private audioContext: AudioContext | null = null;
  private sampleRate: number;

  /**
   * Creates a new AudioContextManager
   * @param sampleRate Optional sample rate for the AudioContext (defaults to 24000)
   */
  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  /**
   * Get the AudioContext, creating it if it doesn't exist
   * @returns The AudioContext or null if creation fails
   */
  getAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        // Create a new AudioContext with the specified sample rate
        this.audioContext = new AudioContext({
          sampleRate: this.sampleRate
        });
        console.log("[AudioContextManager] AudioContext created with sample rate:", this.audioContext.sampleRate);
      } catch (error) {
        console.error("[AudioContextManager] Error creating AudioContext:", error);
        return null;
      }
    }

    // Resume the AudioContext if it's suspended
    if (this.audioContext.state === "suspended") {
      console.log("[AudioContextManager] Resuming suspended AudioContext");
      this.audioContext.resume().catch(error => {
        console.error("[AudioContextManager] Error resuming AudioContext:", error);
      });
    }

    return this.audioContext;
  }

  /**
   * Ensures the AudioContext is resumed - used for handling autoplay policies
   * @returns Promise that resolves when the AudioContext is resumed
   */
  async ensureAudioContextResumed(): Promise<void> {
    const context = this.getAudioContext();
    if (context && context.state === "suspended") {
      console.log("[AudioContextManager] Explicitly resuming AudioContext");
      try {
        await context.resume();
        console.log("[AudioContextManager] AudioContext successfully resumed");
      } catch (error) {
        console.error("[AudioContextManager] Failed to resume AudioContext:", error);
      }
    }
  }

  /**
   * Set the volume for audio output (this method is a stub for compatibility)
   * Note: AudioContext itself doesn't control volume, but this method is here
   * for API compatibility with AudioPlaybackManager
   * @param value Volume level from 0 to 1
   */
  setVolume(value: number): void {
    console.log("[AudioContextManager] Volume setting (stub):", value);
    // This is just a stub method for API compatibility
    // Actual volume control is usually done on audio nodes or elements
  }

  /**
   * Close and cleanup the AudioContext
   */
  closeAudioContext(): void {
    if (this.audioContext) {
      console.log("[AudioContextManager] Closing AudioContext");
      this.audioContext.close().catch(error => {
        console.error("[AudioContextManager] Error closing AudioContext:", error);
      });
      this.audioContext = null;
    }
  }

  /**
   * Cleanup resources (alias for closeAudioContext for API compatibility)
   */
  cleanup(): void {
    this.closeAudioContext();
  }
}
