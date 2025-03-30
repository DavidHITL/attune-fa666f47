
/**
 * Tests WebSocket connection to the realtime endpoint
 */
export const testWebSocketConnection = (): {success: boolean, message: string, close: () => void} => {
  console.log("[testWebSocketConnection] Starting WebSocket connection test");
  
  try {
    // Use the correct project ID from your Supabase configuration
    const projectId = 'oseowhythgbqvllwonaz';
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log("[testWebSocketConnection] Connecting to:", wsUrl);
    
    // Create a WebSocket connection with protocols
    const protocols = ['json', 'openai-realtime'];
    console.log("[testWebSocketConnection] Using protocols:", protocols);
    const ws = new WebSocket(wsUrl, protocols);
    
    // Handle connection events
    ws.onopen = () => {
      console.log("[testWebSocketConnection] Connection established successfully");
      console.log("[testWebSocketConnection] Selected protocol:", ws.protocol || "none");
      try {
        ws.send(JSON.stringify({type: "ping", message: "Connection test"}));
        console.log("[testWebSocketConnection] Sent test ping message");
      } catch (sendError) {
        console.error("[testWebSocketConnection] Error sending test message:", sendError);
      }
    };
    
    ws.onmessage = (event) => {
      console.log("[testWebSocketConnection] Received message:", event.data);
    };
    
    ws.onerror = (error) => {
      console.error("[testWebSocketConnection] WebSocket error:", error);
    };
    
    ws.onclose = (event) => {
      console.log(
        `[testWebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`
      );
    };
    
    // Return connection control object
    return {
      success: true,
      message: "WebSocket connection initiated",
      close: () => {
        console.log("[testWebSocketConnection] Manually closing WebSocket connection");
        ws.close();
      }
    };
  } catch (error) {
    console.error("[testWebSocketConnection] Error creating WebSocket:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      close: () => {} // No-op for failed connections
    };
  }
};
