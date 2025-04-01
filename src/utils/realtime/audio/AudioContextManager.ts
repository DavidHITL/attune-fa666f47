
/**
 * Manages Web Audio API context and nodes
 */
export class AudioContextManager {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isAudioContextResumed: boolean = false;

  constructor(sampleRate: number = 24000) {
    this.initialize(sampleRate);
  }
  
  /**
   * Initialize audio context and gain node
   */
  private initialize(sampleRate: number): void {
    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: sampleRate // Match OpenAI's audio sample rate
      });
      
      // Create gain node for volume control
      if (this.audioContext) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0; // Default volume
        this.gainNode.connect(this.audioContext.destination);
      }
      
      console.log("[AudioContextManager] Successfully initialized audio context");
    } catch (error) {
      console.error("[AudioContextManager] Error initializing audio context:", error);
    }
  }
  
  /**
   * Get the audio context
   */
  public getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
  
  /**
   * Get the gain node
   */
  public getGainNode(): GainNode | null {
    return this.gainNode;
  }
  
  /**
   * Set the volume for the gain node
   */
  public setVolume(value: number): void {
    if (this.gainNode) {
      const safeValue = Math.max(0, Math.min(1, value));
      this.gainNode.gain.value = safeValue;
    }
  }
  
  /**
   * Ensure AudioContext is resumed (needed due to autoplay policy)
   */
  public async ensureAudioContextResumed(): Promise<void> {
    if (!this.audioContext || this.isAudioContextResumed) {
      return Promise.resolve();
    }
    
    // Resume the audio context if it's suspended
    if (this.audioContext.state === 'suspended') {
      console.log("[AudioContextManager] Attempting to resume audio context");
      return this.audioContext.resume()
        .then(() => {
          this.isAudioContextResumed = true;
          console.log("[AudioContextManager] AudioContext resumed successfully");
        })
        .catch(error => {
          console.error("[AudioContextManager] Failed to resume AudioContext:", error);
        });
    }
    
    this.isAudioContextResumed = true;
    return Promise.resolve();
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error("[AudioContextManager] Error closing AudioContext:", err);
      });
      this.audioContext = null;
    }
    
    this.isAudioContextResumed = false;
  }
}
