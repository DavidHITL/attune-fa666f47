
/**
 * Handles reconnection attempts with exponential backoff
 */
export class ReconnectionHandler {
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10; // Increased from 3 to 10
  private reconnectTimeout: number | null = null;
  private onReconnect: () => Promise<void>;

  constructor(onReconnect: () => Promise<void>) {
    this.onReconnect = onReconnect;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  tryReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Maximum reconnection attempts reached");
      return;
    }
    
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30000);
    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
    
    this.reconnectAttempts++;
    this.reconnectTimeout = window.setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      this.onReconnect().catch(err => {
        console.error("Reconnection failed:", err);
        // Continue trying to reconnect unless max attempts reached
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.tryReconnect();
        }
      });
    }, delay);
  }

  /**
   * Reset reconnection attempts counter
   */
  resetAttempts(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * Clear any pending reconnection timeout
   */
  clearTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Get current reconnection attempt count
   */
  getAttempts(): number {
    return this.reconnectAttempts;
  }
}
