
/**
 * Manages WebSocket connection state
 */
export class ConnectionStateManager {
  private isConnected = false;
  private isConnecting = false;
  private shouldReconnect = true;

  /**
   * Set connection state
   */
  setConnected(connected: boolean): void {
    this.isConnected = connected;
    console.log(`[ConnectionStateManager] Connection state: ${connected ? 'connected' : 'disconnected'}`);
  }

  /**
   * Set connecting state
   */
  setConnecting(connecting: boolean): void {
    this.isConnecting = connecting;
    console.log(`[ConnectionStateManager] Connecting state: ${connecting ? 'connecting' : 'not connecting'}`);
  }

  /**
   * Check if currently connected
   */
  isCurrentlyConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Check if currently attempting to connect
   */
  isCurrentlyConnecting(): boolean {
    return this.isConnecting;
  }

  /**
   * Set whether reconnection should be attempted
   */
  setShouldReconnect(shouldReconnect: boolean): void {
    this.shouldReconnect = shouldReconnect;
    console.log(`[ConnectionStateManager] Should reconnect: ${shouldReconnect}`);
  }

  /**
   * Check if reconnection should be attempted
   */
  shouldAttemptReconnect(): boolean {
    return this.shouldReconnect;
  }
}
