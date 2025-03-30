
/**
 * Manages WebSocket message sending and handling
 */
export class MessageManager {
  constructor(private getWebSocket: () => WebSocket | null, private onReconnect: () => void) {}

  /**
   * Send a message through the WebSocket
   */
  send(message: any): boolean {
    const websocket = this.getWebSocket();
    
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      console.error("WebSocket not connected, can't send message");
      return false;
    }
    
    try {
      console.log("Sending message to OpenAI Realtime API:", message.type || "unknown type");
      websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      this.onReconnect();
      return false;
    }
  }
  
  /**
   * Configure the session settings
   */
  configureSession(sessionConfig: any): boolean {
    const websocket = this.getWebSocket();
    
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      console.error("Cannot configure session: WebSocket not connected");
      return false;
    }
    
    try {
      console.log("Configuring session with OpenAI Realtime API settings...");
      websocket.send(JSON.stringify(sessionConfig));
      return true;
    } catch (error) {
      console.error("Failed to configure session:", error);
      this.onReconnect();
      return false;
    }
  }

  /**
   * Set up message handler for WebSocket events
   */
  setMessageHandler(handler: (event: MessageEvent) => void): void {
    const websocket = this.getWebSocket();
    if (!websocket) return;
    websocket.onmessage = handler;
  }
}
