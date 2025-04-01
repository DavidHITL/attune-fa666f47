
/**
 * Manages WebRTC reconnection attempts with exponential backoff
 */
export class ReconnectionManager {
  private retryAttempts: number = 0;
  private maxRetryAttempts: number = 5;
  private baseDelay: number = 1000; // 1 second
  private isRetrying: boolean = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Reset the retry counter and clear any pending timers
   */
  reset(): void {
    this.retryAttempts = 0;
    this.isRetrying = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
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

    if (this.retryAttempts >= this.maxRetryAttempts) {
      console.error(`[ReconnectionManager] Maximum retry attempts (${this.maxRetryAttempts}) reached, giving up`);
      return false;
    }

    // Calculate delay with exponential backoff (1s, 2s, 4s, 8s, 16s)
    const delay = this.baseDelay * Math.pow(2, this.retryAttempts);
    this.retryAttempts++;
    this.isRetrying = true;
    
    console.log(`[ReconnectionManager] Scheduling reconnection attempt ${this.retryAttempts} in ${delay}ms`);

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Schedule reconnection
    this.reconnectTimer = setTimeout(async () => {
      console.log(`[ReconnectionManager] Executing reconnection attempt ${this.retryAttempts}`);
      try {
        const success = await reconnectCallback();
        if (success) {
          console.log("[ReconnectionManager] Reconnection successful");
          this.reset();
        } else {
          console.warn("[ReconnectionManager] Reconnection failed, will try again");
          this.isRetrying = false;
          this.scheduleReconnect(reconnectCallback);
        }
      } catch (error) {
        console.error("[ReconnectionManager] Error during reconnection:", error);
        this.isRetrying = false;
        this.scheduleReconnect(reconnectCallback);
      }
    }, delay);

    return true;
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
