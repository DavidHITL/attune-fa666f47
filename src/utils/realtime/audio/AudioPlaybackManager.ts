
/**
 * Manages audio playback functionality including queue management and event handling
 */
export class AudioPlaybackManager {
  private audioQueue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  private audioContext: AudioContext | null = null;
  private audioElement: HTMLAudioElement | null = null;
  private gainNode: GainNode | null = null;
  private isAudioContextResumed: boolean = false;

  constructor() {
    try {
      // Initialize Web Audio API context
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000 // Match OpenAI's audio sample rate
      });
      
      // Initialize audio element
      const audio = new Audio();
      audio.autoplay = true;
      audio.muted = false;
      audio.volume = 1.0;
      this.audioElement = audio;
      
      // Create gain node for volume control
      if (this.audioContext) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0; // Default volume
        this.gainNode.connect(this.audioContext.destination);
      }
      
      // Append to DOM temporarily to help with autoplay policies
      document.body.appendChild(audio);
      audio.style.display = 'none';
      
      console.log("[AudioPlaybackManager] Successfully initialized audio system");
    } catch (error) {
      console.error("[AudioPlaybackManager] Error initializing audio system:", error);
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
      console.log("[AudioPlaybackManager] Attempting to resume audio context");
      return this.audioContext.resume()
        .then(() => {
          this.isAudioContextResumed = true;
          console.log("[AudioPlaybackManager] AudioContext resumed successfully");
        })
        .catch(error => {
          console.error("[AudioPlaybackManager] Failed to resume AudioContext:", error);
        });
    }
    
    this.isAudioContextResumed = true;
    return Promise.resolve();
  }

  /**
   * Add audio to the playback queue
   */
  public addToPlaybackQueue(wavData: Uint8Array): void {
    this.audioQueue.push(wavData);
    console.log("[AudioPlaybackManager] Added audio to queue, length:", this.audioQueue.length);
  }

  /**
   * Start playing audio from the queue if not already playing
   */
  public startPlayback(): void {
    if (!this.isPlaying && this.audioQueue.length > 0) {
      this.isPlaying = true;
      this.playNextAudioChunk();
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
        // Ensure audio is not muted before playback
        this.audioElement.muted = false;
        
        // Set up event listener for when playback ends
        const handleEnded = () => {
          URL.revokeObjectURL(url);
          this.audioElement?.removeEventListener('ended', handleEnded);
          this.audioElement?.removeEventListener('error', handleError);
          // Continue with next chunk
          this.playNextAudioChunk();
        };
        
        // Set up error handling
        const handleError = (err: Event) => {
          console.error("[AudioPlaybackManager] Error playing audio:", err);
          URL.revokeObjectURL(url);
          this.audioElement?.removeEventListener('error', handleError);
          this.audioElement?.removeEventListener('ended', handleEnded);
          // Continue with next chunk even if this one fails
          handleEnded();
        };
        
        this.audioElement.addEventListener('ended', handleEnded);
        this.audioElement.addEventListener('error', handleError);
        
        // Start playback
        this.audioElement.src = url;
        
        console.log("[AudioPlaybackManager] Starting playback of audio chunk");
        this.audioElement.play()
          .then(() => {
            console.log("[AudioPlaybackManager] Audio playback started successfully");
          })
          .catch(err => {
            console.error("[AudioPlaybackManager] Error playing audio:", err);
            if (err.name === 'NotAllowedError') {
              console.warn("[AudioPlaybackManager] Autoplay prevented by browser policy. User interaction required.");
              // Set up event listener for user interaction to start playback
              const handleUserInteraction = () => {
                if (this.audioElement) {
                  this.audioElement.play()
                    .then(() => console.log("[AudioPlaybackManager] Audio playback started after user interaction"))
                    .catch(e => console.error("[AudioPlaybackManager] Failed to start playback after interaction:", e));
                }
                
                // Remove the event listeners after first interaction
                document.removeEventListener('click', handleUserInteraction);
                document.removeEventListener('touchstart', handleUserInteraction);
              };
              
              document.addEventListener('click', handleUserInteraction);
              document.addEventListener('touchstart', handleUserInteraction);
            }
            // Still call handleEnded to process next chunk even if playback fails
            handleEnded();
          });
      } else {
        console.error("[AudioPlaybackManager] Audio element not available");
        URL.revokeObjectURL(url);
        this.playNextAudioChunk(); // Try next chunk
      }
    } catch (error) {
      console.error("[AudioPlaybackManager] Error playing audio chunk:", error);
      // Continue with next chunk even if this one fails
      this.playNextAudioChunk();
    }
  }

  /**
   * Set the volume for audio playback
   * @param value Volume level from 0 to 1
   */
  public setVolume(value: number): void {
    if (this.gainNode) {
      const safeValue = Math.max(0, Math.min(1, value));
      this.gainNode.gain.value = safeValue;
    }
    
    if (this.audioElement) {
      this.audioElement.volume = Math.max(0, Math.min(1, value));
    }
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
    if (this.audioContext) {
      this.audioContext.close().catch(err => {
        console.error("[AudioPlaybackManager] Error closing AudioContext:", err);
      });
      this.audioContext = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.audioQueue = [];
    this.isPlaying = false;
    this.isAudioContextResumed = false;
  }

  /**
   * Check if audio is currently playing
   */
  public isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}
