
/**
 * Manages connection timeouts
 */
export class ConnectionTimeoutManager {
  private timeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Set a timeout
   * @param callback Function to call when timeout expires
   * @param ms Timeout duration in milliseconds
   */
  setTimeout(callback: () => void, ms: number): void {
    // Clear any existing timeout first to prevent duplicate timeouts
    this.clearTimeout();
    
    console.log(`[ConnectionTimeoutManager] Setting timeout for ${ms}ms`);
    // Set a new timeout
    this.timeout = setTimeout(() => {
      console.log(`[ConnectionTimeoutManager] Timeout expired after ${ms}ms`);
      callback();
      this.timeout = null;
    }, ms);
  }
  
  /**
   * Clear the timeout
   */
  clearTimeout(): void {
    if (this.timeout) {
      console.log(`[ConnectionTimeoutManager] Clearing existing timeout`);
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
  
  /**
   * Check if a timeout is currently active
   */
  hasActiveTimeout(): boolean {
    return this.timeout !== null;
  }
}
