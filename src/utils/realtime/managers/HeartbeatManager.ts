
/**
 * Manages WebSocket heartbeat mechanism
 */
export class HeartbeatManager {
  private heartbeatInterval: number | null = null;
  private heartbeatTimeout: number | null = null;
  private heartbeatMissedResponses = 0;
  private maxMissedHeartbeats = 3;
  private pingIntervalMs = 30000; // 30 seconds between pings
  private pongTimeoutMs = 5000;   // 5 seconds to wait for pong
  private onMissedHeartbeat: () => void;

  constructor(onMissedHeartbeat: () => void) {
    this.onMissedHeartbeat = onMissedHeartbeat;
  }

  /**
   * Set heartbeat configuration
   */
  setConfig(pingIntervalMs: number, pongTimeoutMs: number, maxMissedHeartbeats: number): void {
    console.log("[HeartbeatManager] Setting heartbeat config:", 
                { pingIntervalMs, pongTimeoutMs, maxMissedHeartbeats });
    this.pingIntervalMs = pingIntervalMs;
    this.pongTimeoutMs = pongTimeoutMs;
    this.maxMissedHeartbeats = maxMissedHeartbeats;
  }

  /**
   * Start heartbeat mechanism for keeping connection alive
   */
  start(sendPing: () => boolean): void {
    console.log("[HeartbeatManager] Starting heartbeat mechanism");
    this.stop(); // Clear any existing heartbeat
    
    this.heartbeatMissedResponses = 0;
    
    // Set up the ping interval
    this.heartbeatInterval = window.setInterval(() => {
      if (!sendPing()) {
        console.log("[HeartbeatManager] Failed to send ping, stopping heartbeat");
        this.stop();
        return;
      }
      
      console.log("[HeartbeatManager] Ping sent");
      
      // Set timeout for pong response
      this.heartbeatTimeout = window.setTimeout(() => {
        this.heartbeatMissedResponses++;
        console.warn(`[HeartbeatManager] Pong not received, missed responses: ${this.heartbeatMissedResponses}`);
        
        if (this.heartbeatMissedResponses >= this.maxMissedHeartbeats) {
          console.error("[HeartbeatManager] Max missed heartbeats reached");
          this.stop();
          this.onMissedHeartbeat();
        }
      }, this.pongTimeoutMs);
    }, this.pingIntervalMs);
  }
  
  /**
   * Stop heartbeat mechanism
   */
  stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
  
  /**
   * Handle pong response
   */
  handlePong(): void {
    console.log("[HeartbeatManager] Received pong");
    this.heartbeatMissedResponses = 0;
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }
}
