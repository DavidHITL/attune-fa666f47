
import { AudioElementManager } from './AudioElementManager';
import { AudioContextManager } from './AudioContextManager';
import { PlaybackQueueManager } from './PlaybackQueueManager';

/**
 * Manages audio playback functionality including queue management and event handling
 */
export class AudioPlaybackManager {
  private audioElementManager: AudioElementManager;
  private audioContextManager: AudioContextManager;
  private queueManager: PlaybackQueueManager;

  constructor() {
    this.audioElementManager = new AudioElementManager();
    this.audioContextManager = new AudioContextManager(24000);
    this.queueManager = new PlaybackQueueManager();
    
    console.log("[AudioPlaybackManager] Successfully initialized audio system");
  }

  /**
   * Ensure AudioContext is resumed (needed due to autoplay policy)
   */
  public async ensureAudioContextResumed(): Promise<void> {
    return this.audioContextManager.ensureAudioContextResumed();
  }

  /**
   * Add audio to the playback queue
   */
  public addToPlaybackQueue(wavData: Uint8Array): void {
    this.queueManager.addToQueue(wavData);
  }

  /**
   * Start playing audio from the queue if not already playing
   */
  public startPlayback(): void {
    if (!this.queueManager.isPlaybackActive() && this.queueManager.hasItems()) {
      this.queueManager.setPlaybackState(true);
      this.playNextAudioChunk();
    }
  }

  /**
   * Play the next audio chunk in the queue
   */
  private playNextAudioChunk(): void {
    if (!this.queueManager.hasItems()) {
      this.queueManager.setPlaybackState(false);
      return;
    }

    this.queueManager.setPlaybackState(true);
    const wavData = this.queueManager.getNextItem()!;

    try {
      // Create blob URL for the audio element
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      // Set up event listener for when playback ends
      const handleEnded = () => {
        URL.revokeObjectURL(url);
        const audioElement = this.audioElementManager.getAudioElement();
        audioElement?.removeEventListener('ended', handleEnded);
        audioElement?.removeEventListener('error', handleError);
        // Continue with next chunk
        this.playNextAudioChunk();
      };
      
      // Set up error handling
      const handleError = (err: Event) => {
        console.error("[AudioPlaybackManager] Error playing audio:", err);
        URL.revokeObjectURL(url);
        const audioElement = this.audioElementManager.getAudioElement();
        audioElement?.removeEventListener('error', handleError);
        audioElement?.removeEventListener('ended', handleEnded);
        // Continue with next chunk even if this one fails
        handleEnded();
      };
      
      const audioElement = this.audioElementManager.getAudioElement();
      if (audioElement) {
        audioElement.addEventListener('ended', handleEnded);
        audioElement.addEventListener('error', handleError);
        
        // Start playback
        console.log("[AudioPlaybackManager] Starting playback of audio chunk");
        this.audioElementManager.playFromUrl(url)
          .catch(err => {
            if (err.name === 'NotAllowedError') {
              console.warn("[AudioPlaybackManager] Autoplay prevented by browser policy. User interaction required.");
              // Set up event listener for user interaction to start playback
              const handleUserInteraction = () => {
                const audioElement = this.audioElementManager.getAudioElement();
                if (audioElement) {
                  audioElement.play()
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
    this.audioContextManager.setVolume(value);
    this.audioElementManager.setVolume(value);
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    this.audioElementManager.cleanup();
    this.audioContextManager.cleanup();
    this.queueManager.clear();
  }

  /**
   * Check if audio is currently playing
   */
  public isCurrentlyPlaying(): boolean {
    return this.queueManager.isPlaybackActive();
  }
}
