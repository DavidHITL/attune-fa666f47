
/**
 * Tests WebSocket connection to the realtime endpoint with detailed diagnostics
 */
export const testWebSocketConnection = async (): Promise<{success: boolean; message: string; close: () => void}> => {
  console.log("[testWebSocketConnection] Starting WebSocket connection test");
  
  return new Promise((resolve) => {
    try {
      // Use the correct project ID from your Supabase configuration
      const projectId = 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
      
      console.log("[testWebSocketConnection] Connecting to:", wsUrl);
      
      // Create WebSocket with protocols that OpenAI uses
      const protocols = ['json', 'openai-realtime'];
      console.log("[testWebSocketConnection] Using protocols:", protocols.join(', '));
      
      // Connection timeout handling
      const timeoutId = setTimeout(() => {
        console.error("[testWebSocketConnection] Connection timed out after 10 seconds");
        resolve({
          success: false,
          message: "Connection timed out after 10 seconds. The server might not be responding.",
          close: () => {}
        });
      }, 10000);
      
      // Create WebSocket connection
      const ws = new WebSocket(wsUrl, protocols);
      
      // Handle connection events
      ws.onopen = () => {
        clearTimeout(timeoutId);
        console.log("[testWebSocketConnection] Connection established successfully");
        console.log("[testWebSocketConnection] Selected protocol:", ws.protocol || "none");
        
        resolve({
          success: true,
          message: `WebSocket connection established successfully${ws.protocol ? ` with protocol: ${ws.protocol}` : ''}`,
          close: () => {
            console.log("[testWebSocketConnection] Manually closing WebSocket connection");
            ws.close();
          }
        });
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[testWebSocketConnection] Received message:", data);
        } catch (e) {
          console.log("[testWebSocketConnection] Received non-JSON message:", event.data);
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("[testWebSocketConnection] WebSocket error:", error);
        
        resolve({
          success: false,
          message: "WebSocket connection failed. Check browser console for details.",
          close: () => {
            try {
              ws.close();
            } catch (e) {
              // Ignore close errors
            }
          }
        });
      };
      
      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        console.log(
          `[testWebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`
        );
        
        if (!event.wasClean) {
          resolve({
            success: false,
            message: `Connection closed unexpectedly (Code: ${event.code}). This might indicate CORS problems or an error in the Edge Function.`,
            close: () => {}
          });
        }
      };
      
    } catch (error) {
      console.error("[testWebSocketConnection] Error creating WebSocket:", error);
      resolve({
        success: false,
        message: `Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}`,
        close: () => {}
      });
    }
  });
};
