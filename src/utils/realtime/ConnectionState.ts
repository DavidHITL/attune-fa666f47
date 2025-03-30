
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
    return this._isConnected && 
           !!websocket && 
           websocket.readyState === WebSocket.OPEN;
  }
}
