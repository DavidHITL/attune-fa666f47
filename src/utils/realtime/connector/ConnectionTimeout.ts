
/**
 * Manages connection timeout for WebRTC operations
 */
export class ConnectionTimeout {
  private timeout: ReturnType<typeof setTimeout> | null = null;
  private timeoutDuration: number;
  
  /**
   * Create a new ConnectionTimeout instance
   * @param timeoutDuration Timeout duration in milliseconds
   */
  constructor(timeoutDuration: number) {
    this.timeoutDuration = timeoutDuration;
  }
  
  /**
   * Set a timeout for a connection operation
   * @param callback The function to call when the timeout is reached
   */
  setTimeout(callback: () => void): void {
    this.clearTimeout();
    this.timeout = setTimeout(() => {
      callback();
      this.timeout = null;
    }, this.timeoutDuration);
  }
  
  /**
   * Clear any pending timeout
   */
  clearTimeout(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
  
  /**
   * Check if a timeout is currently set
   * @returns Whether a timeout is currently set
   */
  isTimeoutSet(): boolean {
    return this.timeout !== null;
  }
}
