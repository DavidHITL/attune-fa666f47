
/**
 * Manages connection timeout logic for WebRTC connections
 */
export class ConnectionTimeout {
  private timeoutId: number | null = null;
  
  /**
   * Set a timeout for connection establishment
   * @param onTimeout Callback to execute when timeout occurs
   * @param timeoutMs Timeout in milliseconds
   * @returns The timeout ID
   */
  setTimeout(onTimeout: () => void, timeoutMs: number = 15000): number {
    this.clearTimeout();
    console.log(`[ConnectionTimeout] Setting connection timeout for ${timeoutMs}ms`);
    
    this.timeoutId = setTimeout(() => {
      console.error(`[ConnectionTimeout] Connection timeout after ${timeoutMs}ms`);
      onTimeout();
    }, timeoutMs) as unknown as number;
    
    return this.timeoutId;
  }
  
  /**
   * Clear the current timeout if it exists
   */
  clearTimeout(): void {
    if (this.timeoutId !== null) {
      console.log("[ConnectionTimeout] Clearing connection timeout");
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
  
  /**
   * Check if a timeout is currently active
   */
  isActive(): boolean {
    return this.timeoutId !== null;
  }
  
  /**
   * Reset the timeout with a new duration
   * @param onTimeout Callback to execute when timeout occurs
   * @param timeoutMs Timeout in milliseconds
   * @returns The new timeout ID
   */
  resetTimeout(onTimeout: () => void, timeoutMs: number = 15000): number {
    return this.setTimeout(onTimeout, timeoutMs);
  }
}
