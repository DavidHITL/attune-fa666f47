
/**
 * Manages timeouts for asynchronous operations
 */
export class TimeoutManager {
  private connectionTimeout: number = 15000; // 15 second timeout

  /**
   * Create a timeout that will reject a promise if exceeded
   */
  createTimeout(onTimeout: () => void): number {
    // Use window.setTimeout to ensure correct type
    return window.setTimeout(onTimeout, this.connectionTimeout);
  }
  
  /**
   * Clear the specified timeout
   */
  clearTimeout(timeoutId: number | null): void {
    if (timeoutId !== null) {
      window.clearTimeout(timeoutId);
    }
  }
  
  /**
   * Set the connection timeout value
   */
  setConnectionTimeout(timeout: number): void {
    this.connectionTimeout = timeout;
  }
  
  /**
   * Get the current timeout value
   */
  getConnectionTimeout(): number {
    return this.connectionTimeout;
  }
}
