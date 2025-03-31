
/**
 * Handles WebSocket message sending
 */
export class WebSocketMessageHandler {
  /**
   * Send a message through the WebSocket
   */
  sendMessage(websocket: WebSocket | null, message: any): boolean {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      console.error("[WebSocketMessageHandler] WebSocket is not connected, state:", 
                  websocket ? websocket.readyState : "null");
      return false;
    }
    
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      console.log("[WebSocketMessageHandler] Sending message:", message.type || "unknown type");
      websocket.send(messageStr);
      return true;
    } catch (error) {
      console.error("[WebSocketMessageHandler] Error sending WebSocket message:", error);
      return false;
    }
  }
}
