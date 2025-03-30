
/**
 * Handles reconnection attempts with exponential backoff
 */
export class ReconnectionHandler {
  private reconnectAttempts: number = 0;
  private readonly maxReconnectAttempts: number = 10; // Reduced from 15 to 10
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
    
    // Gentler exponential backoff with jitter to prevent thundering herd
    // Start with 2 second base and cap at 20 seconds max
    const baseDelay = 2000; // ms
    const maxDelay = 20000; // 20 seconds max
    const exponent = Math.min(this.reconnectAttempts, 6); // Cap the exponent to prevent excessive delays
    
    // Calculate delay with jitter (±20%)
    let delay = Math.min(baseDelay * Math.pow(1.5, exponent), maxDelay);
    const jitter = delay * 0.2 * (Math.random() - 0.5); // ±10% jitter
    delay = Math.max(1000, delay + jitter); // Ensure minimum 1000ms
    
    console.log(`Attempting to reconnect in ${Math.round(delay / 1000)} seconds... (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    this.isReconnecting = true;
    this.reconnectAttempts++;
    
    // Fix: Use window.setTimeout to ensure number type compatibility
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
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
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
