
/**
 * Simple stub for connection state 
 * All actual realtime functionality has been removed
 */
export class ConnectionState {
  private _isConnected: boolean = false;
  
  /**
   * Set connection state
   */
  setConnected(value: boolean): void {
    this._isConnected = value;
  }
  
  /**
   * Get connection state
   */
  isConnected(): boolean {
    return false; // Always return false since functionality is disabled
  }
  
  /**
   * Check connection
   */
  checkConnection(): boolean {
    return false; // Always return false since functionality is disabled
  }
}
