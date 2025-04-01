
/**
 * Utility class to manage AudioContext creation and cleanup
 */
export class AudioContextManager {
  private audioContext: AudioContext | null = null;

  /**
   * Get the AudioContext, creating it if it doesn't exist
   * @returns The AudioContext or null if creation fails
   */
  getAudioContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        // Create a new AudioContext with 24kHz sample rate for compatibility with OpenAI's API
        this.audioContext = new AudioContext({
          sampleRate: 24000
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
}
