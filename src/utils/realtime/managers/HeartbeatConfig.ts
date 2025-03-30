
/**
 * Manages WebSocket heartbeat configuration
 */
export class HeartbeatConfig {
  private pingInterval: number = 30000;  // 30 seconds
  private pongTimeout: number = 5000;    // 5 seconds
  private maxMissed: number = 3;         // 3 missed pongs before reconnect

  /**
   * Set heartbeat configuration values
   */
  setConfig(pingInterval: number, pongTimeout: number, maxMissed: number): void {
    this.pingInterval = pingInterval;
    this.pongTimeout = pongTimeout;
    this.maxMissed = maxMissed;
  }

  /**
   * Get ping interval in milliseconds
   */
  getPingInterval(): number {
    return this.pingInterval;
  }

  /**
   * Get pong timeout in milliseconds
   */
  getPongTimeout(): number {
    return this.pongTimeout;
  }

  /**
   * Get maximum number of missed pongs before reconnect
   */
  getMaxMissed(): number {
    return this.maxMissed;
  }
}
