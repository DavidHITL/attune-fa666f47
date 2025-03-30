
/**
 * Manages WebSocket connection state
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
    return this._isConnected;
  }
  
  /**
   * Check if WebSocket is connected and in OPEN state
   */
  checkConnection(websocket: WebSocket | null): boolean {
    if (!websocket) {
      return false;
    }
    
    // Double-check the actual WebSocket state
    const isActuallyConnected = websocket.readyState === WebSocket.OPEN;
    
    // If our state says connected but WebSocket is closed, update our state
    if (this._isConnected && !isActuallyConnected) {
      console.warn("Connection state mismatch - updating state to match actual WebSocket state");
      this._isConnected = false;
    }
    
    return this._isConnected && isActuallyConnected;
  }
}
