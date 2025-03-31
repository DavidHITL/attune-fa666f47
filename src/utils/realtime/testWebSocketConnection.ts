
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
      console.log("[testWebSocketConnection] Browser WebSocket support check:", typeof WebSocket);
      
      // Create a WebSocket connection with protocols that OpenAI uses
      const protocols = ['json', 'openai-realtime'];
      console.log("[testWebSocketConnection] Using protocols:", protocols.join(', '));
      
      let ws: WebSocket | null = null;
      let timeoutId = setTimeout(() => {
        console.error("[testWebSocketConnection] Connection timed out after 10 seconds");
        if (ws) {
          try {
            ws.close();
          } catch (e) {
            console.error("[testWebSocketConnection] Error closing socket after timeout:", e);
          }
        }
        
        resolve({
          success: false,
          message: "Connection timed out after 10 seconds. The server might not be responding or could be blocking the connection.",
          close: () => {}
        });
      }, 10000);
      
      // Test connection with specific protocols
      ws = new WebSocket(wsUrl, protocols);
      ws.binaryType = "arraybuffer";
      
      console.log("[testWebSocketConnection] WebSocket created, initial readyState:", ws.readyState);
      
      // Handle connection events
      ws.onopen = () => {
        clearTimeout(timeoutId);
        console.log("[testWebSocketConnection] Connection established successfully");
        console.log("[testWebSocketConnection] Selected protocol:", ws.protocol || "none");
        
        try {
          // Send a simple ping message to test the connection
          ws.send(JSON.stringify({
            type: "ping",
            message: "Connection test",
            timestamp: new Date().toISOString()
          }));
          console.log("[testWebSocketConnection] Sent test ping message");
        } catch (sendError) {
          console.error("[testWebSocketConnection] Error sending test message:", sendError);
        }
        
        resolve({
          success: true,
          message: `WebSocket connection established successfully${ws.protocol ? ` with protocol: ${ws.protocol}` : ''}`,
          close: () => {
            console.log("[testWebSocketConnection] Manually closing WebSocket connection");
            try {
              if (ws) ws.close();
            } catch (e) {
              console.error("[testWebSocketConnection] Error closing connection:", e);
            }
          }
        });
      };
      
      ws.onmessage = (event) => {
        let messageData = "Binary data";
        try {
          if (typeof event.data === 'string') {
            messageData = event.data;
            const data = JSON.parse(event.data);
            console.log("[testWebSocketConnection] Received message:", data);
          } else {
            console.log("[testWebSocketConnection] Received binary message");
          }
        } catch (e) {
          console.log("[testWebSocketConnection] Received non-JSON message:", messageData);
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("[testWebSocketConnection] WebSocket error:", error);
        
        resolve({
          success: false,
          message: "WebSocket connection failed. Check browser console for details and verify the edge function is handling WebSocket upgrades correctly.",
          close: () => {
            try {
              if (ws) ws.close();
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
        
        // Only resolve if not already resolved (by onopen or onerror)
        if (!event.wasClean) {
          resolve({
            success: false,
            message: `Connection closed unexpectedly (Code: ${event.code}). This might indicate protocol negotiation issues, CORS problems, or an error in the Edge Function.`,
            close: () => {}
          });
        }
      };
      
    } catch (error) {
      console.error("[testWebSocketConnection] Error creating WebSocket:", error);
      resolve({
        success: false,
        message: `Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}. Check if your browser supports WebSockets and if there are any network restrictions.`,
        close: () => {}
      });
    }
  });
};
