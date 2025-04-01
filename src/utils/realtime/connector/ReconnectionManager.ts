
/**
 * Manages WebRTC reconnection attempts with exponential backoff
 */
export class ReconnectionManager {
  private retryAttempts: number = 0;
  private maxRetryAttempts: number = 5;
  private baseDelay: number = 1000; // 1 second
  private isRetrying: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private lastError: Error | null = null;

  /**
   * Reset the retry counter and clear any pending timers
   */
  reset(): void {
    console.log("[ReconnectionManager] Resetting reconnection state");
    this.retryAttempts = 0;
    this.isRetrying = false;
    this.lastError = null;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Get the current retry attempt count
   */
  getRetryAttempts(): number {
    return this.retryAttempts;
  }

  /**
   * Get the maximum number of retry attempts
   */
  getMaxRetryAttempts(): number {
    return this.maxRetryAttempts;
  }

  /**
   * Check if currently retrying
   */
  isCurrentlyRetrying(): boolean {
    return this.isRetrying;
  }

  /**
   * Check if maximum retry attempts have been reached
   */
  hasReachedMaxAttempts(): boolean {
    return this.retryAttempts >= this.maxRetryAttempts;
  }

  /**
   * Get the last error that occurred during reconnection
   */
  getLastError(): Error | null {
    return this.lastError;
  }

  /**
   * Attempt to reconnect with exponential backoff
   * @param reconnectCallback The function to call for reconnection
   * @returns Whether a reconnection was scheduled
   */
  scheduleReconnect(reconnectCallback: () => Promise<boolean>): boolean {
    // Don't schedule another retry if one is already in progress
    if (this.isRetrying) {
      console.log("[ReconnectionManager] Reconnection already in progress, not scheduling another");
      return false;
    }

    if (this.hasReachedMaxAttempts()) {
      console.error(`[ReconnectionManager] Maximum retry attempts (${this.maxRetryAttempts}) reached, giving up`);
      return false;
    }

    // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, 16s)
    const delay = this.calculateBackoffDelay();
    this.retryAttempts++;
    this.isRetrying = true;
    
    console.log(`[ReconnectionManager] Scheduling reconnection attempt ${this.retryAttempts}/${this.maxRetryAttempts} in ${delay}ms`);

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Schedule reconnection
    this.reconnectTimer = setTimeout(async () => {
      console.log(`[ReconnectionManager] Executing reconnection attempt ${this.retryAttempts}/${this.maxRetryAttempts}`);
      try {
        const success = await reconnectCallback();
        if (success) {
          console.log("[ReconnectionManager] Reconnection successful");
          this.reset();
        } else {
          console.warn(`[ReconnectionManager] Reconnection attempt ${this.retryAttempts} failed, will try again if attempts remain`);
          this.isRetrying = false;
          if (!this.hasReachedMaxAttempts()) {
            this.scheduleReconnect(reconnectCallback);
          } else {
            console.error("[ReconnectionManager] All reconnection attempts failed");
          }
        }
      } catch (error) {
        console.error("[ReconnectionManager] Error during reconnection:", error);
        this.lastError = error instanceof Error ? error : new Error(String(error));
        this.isRetrying = false;
        
        if (!this.hasReachedMaxAttempts()) {
          this.scheduleReconnect(reconnectCallback);
        } else {
          console.error("[ReconnectionManager] All reconnection attempts failed after error");
        }
      }
    }, delay);

    return true;
  }

  /**
   * Calculate the backoff delay based on retry attempts
   * @returns Delay in milliseconds
   */
  private calculateBackoffDelay(): number {
    // Exponential backoff with jitter to avoid thundering herd
    const exponentialDelay = this.baseDelay * Math.pow(2, this.retryAttempts);
    // Add random jitter (±20%)
    const jitter = exponentialDelay * 0.2 * (Math.random() * 2 - 1);
    return Math.min(exponentialDelay + jitter, 30000); // Cap at 30 seconds
  }

  /**
   * Check if a reconnection should be attempted for the given connection state
   * @param state The current WebRTC connection state
   * @returns Whether reconnection should be attempted
   */
  shouldReconnect(state: RTCPeerConnectionState): boolean {
    return state === 'disconnected' || state === 'failed';
  }
}
