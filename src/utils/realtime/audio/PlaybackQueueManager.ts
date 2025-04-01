
/**
 * Manages audio playback queue functionality
 */
export class PlaybackQueueManager {
  private audioQueue: Uint8Array[] = [];
  private isPlaying: boolean = false;
  
  /**
   * Add audio to the playback queue
   */
  public addToQueue(wavData: Uint8Array): void {
    this.audioQueue.push(wavData);
    console.log("[PlaybackQueueManager] Added audio to queue, length:", this.audioQueue.length);
  }
  
  /**
   * Check if queue has items
   */
  public hasItems(): boolean {
    return this.audioQueue.length > 0;
  }
  
  /**
   * Get next item from queue
   */
  public getNextItem(): Uint8Array | undefined {
    return this.audioQueue.shift();
  }
  
  /**
   * Check if playback is in progress
   */
  public isPlaybackActive(): boolean {
    return this.isPlaying;
  }
  
  /**
   * Set playback state
   */
  public setPlaybackState(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
  }
  
  /**
   * Clear the queue
   */
  public clear(): void {
    this.audioQueue = [];
    this.isPlaying = false;
  }
  
  /**
   * Get queue length
   */
  public getQueueLength(): number {
    return this.audioQueue.length;
  }
}
