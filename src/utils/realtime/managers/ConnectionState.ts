
/**
 * Manages WebSocket connection state
 */
export class ConnectionState {
  private _isConnected: boolean = false;
  private _isConnecting: boolean = false;
  private _shouldReconnect: boolean = true;
  
  /**
   * Set connection state
   */
  setConnected(value: boolean): void {
    this._isConnected = value;
  }
  
  /**
   * Set connecting state
   */
  setConnecting(value: boolean): void {
    this._isConnecting = value;
  }

  /**
   * Get connection state
   */
  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get connecting state
   */
  isConnecting(): boolean {
    return this._isConnecting;
  }
  
  /**
   * Set whether we should attempt reconnection
   */
  setShouldReconnect(value: boolean): void {
    this._shouldReconnect = value;
  }
  
  /**
   * Check if we should attempt reconnection
   */
  shouldTryReconnect(): boolean {
    return this._shouldReconnect;
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
