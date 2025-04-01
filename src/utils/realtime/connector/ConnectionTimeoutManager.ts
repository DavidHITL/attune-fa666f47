
/**
 * Manages connection timeout for WebRTC connections
 */
export class ConnectionTimeoutManager {
  private connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Clear any pending connection timeout
   */
  clearTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }
  
  /**
   * Set a connection timeout
   */
  setTimeout(callback: () => void, duration: number = 30000): void {
    this.clearTimeout();
    
    this.connectionTimeout = setTimeout(() => {
      console.error(`[ConnectionTimeoutManager] Connection timeout reached after ${duration}ms`);
      callback();
    }, duration);
  }
}
