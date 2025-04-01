
/**
 * Manages HTML audio elements for playback
 */
export class AudioElementManager {
  private audioElement: HTMLAudioElement | null = null;
  private volume: number = 1.0;
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the audio element
   */
  private initialize(): void {
    try {
      // Initialize audio element
      const audio = new Audio();
      audio.autoplay = true;
      audio.muted = false;
      audio.volume = this.volume;
      this.audioElement = audio;
      
      // Append to DOM temporarily to help with autoplay policies
      document.body.appendChild(audio);
      audio.style.display = 'none';
      
      console.log("[AudioElementManager] Successfully initialized audio element");
    } catch (error) {
      console.error("[AudioElementManager] Error initializing audio element:", error);
    }
  }
  
  /**
   * Get the audio element
   */
  public getAudioElement(): HTMLAudioElement | null {
    return this.audioElement;
  }
  
  /**
   * Set the volume
   */
  public setVolume(value: number): void {
    const safeValue = Math.max(0, Math.min(1, value));
    this.volume = safeValue;
    
    if (this.audioElement) {
      this.audioElement.volume = safeValue;
    }
  }
  
  /**
   * Play audio from URL
   */
  public playFromUrl(url: string): Promise<void> {
    if (!this.audioElement) {
      return Promise.reject(new Error("Audio element not available"));
    }
    
    this.audioElement.muted = false;
    this.audioElement.src = url;
    
    return this.audioElement.play()
      .then(() => {
        console.log("[AudioElementManager] Audio playback started successfully");
      })
      .catch(err => {
        console.error("[AudioElementManager] Error playing audio:", err);
        throw err;
      });
  }
  
  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      
      // Remove from DOM if it was added
      if (this.audioElement.parentNode) {
        this.audioElement.parentNode.removeChild(this.audioElement);
      }
      
      this.audioElement = null;
    }
  }
}
