
/**
 * Manages connection timeouts
 */
export class ConnectionTimeoutManager {
  private timeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Set a timeout
   */
  setTimeout(callback: () => void, ms: number): void {
    // Clear any existing timeout
    this.clearTimeout();
    
    // Set a new timeout
    this.timeout = setTimeout(callback, ms);
  }
  
  /**
   * Clear the timeout
   */
  clearTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}
