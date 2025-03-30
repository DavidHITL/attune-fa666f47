
/**
 * Tests the complete chat flow with the realtime endpoint
 */
export const testCompleteChatFlow = (): {success: boolean, message: string, close: () => void} => {
  console.log("[testCompleteChatFlow] Starting complete chat flow test");
  
  try {
    // Use the correct project ID
    const projectId = 'oseowhythgbqvllwonaz';
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log("[testCompleteChatFlow] Connecting to:", wsUrl);
    
    // Create a WebSocket connection
    const ws = new WebSocket(wsUrl);
    
    // Handle connection events
    ws.onopen = () => {
      console.log("[testCompleteChatFlow] Connection established successfully");
      
      // Send session initialization message
      try {
        ws.send(JSON.stringify({
          type: "session_init",
          message: "Initialize session",
          data: { 
            userId: "test-user-id",
            sessionId: `test-session-${Date.now()}`
          }
        }));
        console.log("[testCompleteChatFlow] Sent session initialization message");
        
        // After a short delay, send a test message
        setTimeout(() => {
          try {
            ws.send(JSON.stringify({
              type: "chat_message",
              message: "Hello, this is a test message from the complete chat flow test"
            }));
            console.log("[testCompleteChatFlow] Sent test chat message");
          } catch (sendError) {
            console.error("[testCompleteChatFlow] Error sending chat message:", sendError);
          }
        }, 1000);
      } catch (sendError) {
        console.error("[testCompleteChatFlow] Error sending session init message:", sendError);
      }
    };
    
    ws.onmessage = (event) => {
      console.log("[testCompleteChatFlow] Received message:", event.data);
      try {
        const data = JSON.parse(event.data);
        console.log("[testCompleteChatFlow] Parsed message data:", data);
      } catch (parseError) {
        console.log("[testCompleteChatFlow] Could not parse message as JSON, raw data:", event.data);
      }
    };
    
    ws.onerror = (error) => {
      console.error("[testCompleteChatFlow] WebSocket error:", error);
    };
    
    ws.onclose = (event) => {
      console.log(
        `[testCompleteChatFlow] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`
      );
    };
    
    // Return connection control object
    return {
      success: true,
      message: "Chat flow test initiated",
      close: () => {
        console.log("[testCompleteChatFlow] Manually closing WebSocket connection");
        ws.close();
      }
    };
  } catch (error) {
    console.error("[testCompleteChatFlow] Error creating WebSocket:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      close: () => {} // No-op for failed connections
    };
  }
};
