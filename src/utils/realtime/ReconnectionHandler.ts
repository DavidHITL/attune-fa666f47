
/**
 * Handles reconnection attempts with exponential backoff
 */
export class ReconnectionHandler {
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 15; // Increased from 10 to 15
  private reconnectTimeout: number | null = null;
  private onReconnect: () => Promise<void>;
  private isReconnecting: boolean = false;

  constructor(onReconnect: () => Promise<void>) {
    this.onReconnect = onReconnect;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  tryReconnect(): void {
    if (this.isReconnecting) {
      console.log("Reconnection already in progress");
      return;
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`Maximum reconnection attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    
    // Improved backoff strategy: initial 500ms with smoother increase
    // Cap max delay at 45 seconds for better UX
    const delay = Math.min(500 * Math.pow(1.3, this.reconnectAttempts), 45000);
    
    console.log(`Attempting to reconnect in ${Math.round(delay / 1000)} seconds... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    this.reconnectTimeout = window.setTimeout(async () => {
      console.log(`Executing reconnection attempt ${this.reconnectAttempts} of ${this.maxReconnectAttempts}`);
      
      try {
        await this.onReconnect();
        console.log("Reconnection successful!");
        this.isReconnecting = false;
      } catch (err) {
        console.error("Reconnection failed:", err);
        this.isReconnecting = false;
        
        // Continue trying to reconnect unless max attempts reached
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.tryReconnect();
        }
      }
    }, delay);
  }

  /**
   * Reset reconnection attempts counter
   */
  resetAttempts(): void {
    this.reconnectAttempts = 0;
    this.isReconnecting = false;
  }

  /**
   * Clear any pending reconnection timeout
   */
  clearTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.isReconnecting = false;
  }

  /**
   * Get current reconnection attempt count
   */
  getAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Check if currently attempting to reconnect
   */
  isAttemptingReconnect(): boolean {
    return this.isReconnecting;
  }
}
