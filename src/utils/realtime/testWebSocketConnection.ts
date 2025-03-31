
/**
 * Tests WebSocket connection to the realtime endpoint
 */
export const testWebSocketConnection = async (): Promise<{success: boolean; message: string; close: () => void}> => {
  console.log("[testWebSocketConnection] Starting WebSocket connection test");
  
  return new Promise((resolve) => {
    try {
      // Use the correct project ID from your Supabase configuration
      const projectId = 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
      
      console.log("[testWebSocketConnection] Connecting to:", wsUrl);
      
      // Create a WebSocket connection - try both with and without protocols
      const protocols = ['json', 'openai-realtime'];
      console.log("[testWebSocketConnection] Using protocols:", protocols.join(', '));
      const ws = new WebSocket(wsUrl, protocols);
      ws.binaryType = "arraybuffer";
      
      // Set timeout for connection
      const timeoutId = setTimeout(() => {
        console.error("[testWebSocketConnection] Connection timed out after 5 seconds");
        try {
          ws.close();
        } catch (e) {
          // Ignore close errors
        }
        resolve({
          success: false,
          message: "Connection timed out after 5 seconds",
          close: () => {}
        });
      }, 5000);
      
      // Handle connection events
      ws.onopen = () => {
        clearTimeout(timeoutId);
        console.log("[testWebSocketConnection] Connection established successfully");
        console.log("[testWebSocketConnection] Selected protocol:", ws.protocol || "none");
        
        try {
          ws.send(JSON.stringify({type: "ping", message: "Connection test"}));
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
              ws.close();
            } catch (e) {
              // Ignore close errors
            }
          }
        });
      };
      
      ws.onmessage = (event) => {
        console.log("[testWebSocketConnection] Received message:", event.data);
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "connection.established") {
            console.log("[testWebSocketConnection] Server confirmed connection");
          }
        } catch (e) {
          // Non-JSON message, just log it
          console.log("[testWebSocketConnection] Received non-JSON message");
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("[testWebSocketConnection] WebSocket error:", error);
        
        // Try without protocols if this is a protocol error
        if (ws.protocol) {
          console.log("[testWebSocketConnection] Error with protocol, retrying without protocol");
          try {
            ws.close();
          } catch (e) {
            // Ignore close errors
          }
          
          // Retry without protocols
          const basicWs = new WebSocket(wsUrl);
          basicWs.binaryType = "arraybuffer";
          
          basicWs.onopen = () => {
            clearTimeout(timeoutId);
            console.log("[testWebSocketConnection] Connection without protocol established successfully");
            resolve({
              success: true,
              message: "WebSocket connection established successfully without protocols",
              close: () => {
                console.log("[testWebSocketConnection] Closing fallback WebSocket connection");
                try {
                  basicWs.close();
                } catch (e) {
                  // Ignore close errors
                }
              }
            });
          };
          
          basicWs.onerror = () => {
            console.error("[testWebSocketConnection] Both connection attempts failed");
            resolve({
              success: false,
              message: "WebSocket connection failed with and without protocols. Check the server logs for details.",
              close: () => {}
            });
          };
          
          return; // Exit this handler since we're trying a new connection
        }
        
        resolve({
          success: false,
          message: "WebSocket connection error occurred. Check browser console for details.",
          close: () => {}
        });
      };
      
      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        console.log(
          `[testWebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`
        );
        
        // Only resolve if we haven't already resolved from another handler
        if (!event.wasClean && event.code !== 1000) {
          resolve({
            success: false,
            message: `Connection closed unexpectedly (Code: ${event.code}). This might be due to CORS or server configuration issues.`,
            close: () => {}
          });
        }
      };
    } catch (error) {
      console.error("[testWebSocketConnection] Error creating WebSocket:", error);
      resolve({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        close: () => {} // No-op for failed connections
      });
    }
  });
};
