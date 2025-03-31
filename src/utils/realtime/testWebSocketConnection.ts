
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
      
      // Create a WebSocket connection without protocols initially to test basic connectivity
      console.log("[testWebSocketConnection] Attempting basic connection without protocols");
      const ws = new WebSocket(wsUrl);
      
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
        
        try {
          ws.send(JSON.stringify({type: "ping", message: "Connection test"}));
          console.log("[testWebSocketConnection] Sent test ping message");
        } catch (sendError) {
          console.error("[testWebSocketConnection] Error sending test message:", sendError);
        }
        
        resolve({
          success: true,
          message: "WebSocket connection established successfully",
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
        // Don't resolve here, already resolved in onopen
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("[testWebSocketConnection] WebSocket error:", error);
        
        // Check if we tried without protocols, try again with protocols
        if (!ws.protocol) {
          console.log("[testWebSocketConnection] Retrying with protocols...");
          try {
            ws.close();
          } catch (e) {
            // Ignore close errors
          }
          
          // Try with protocols
          const protocolWs = new WebSocket(wsUrl, ['json', 'openai-realtime']);
          
          protocolWs.onopen = () => {
            clearTimeout(timeoutId);
            console.log("[testWebSocketConnection] Connection with protocols established successfully");
            console.log("[testWebSocketConnection] Selected protocol:", protocolWs.protocol || "none");
            
            try {
              protocolWs.send(JSON.stringify({type: "ping", message: "Connection test with protocols"}));
            } catch (sendError) {
              console.error("[testWebSocketConnection] Error sending test message:", sendError);
            }
            
            resolve({
              success: true,
              message: "WebSocket connection established successfully with protocols",
              close: () => {
                console.log("[testWebSocketConnection] Manually closing protocol WebSocket connection");
                try {
                  protocolWs.close();
                } catch (e) {
                  // Ignore close errors
                }
              }
            });
          };
          
          protocolWs.onerror = () => {
            clearTimeout(timeoutId);
            console.error("[testWebSocketConnection] WebSocket connection failed with and without protocols");
            
            resolve({
              success: false,
              message: "WebSocket connection failed with and without protocols",
              close: () => {}
            });
          };
          
          return; // Exit this error handler since we're trying a new connection
        }
        
        resolve({
          success: false,
          message: "WebSocket connection error occurred",
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
          `[testWebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`
        );
        
        // Only resolve if we haven't already resolved from another handler
        if (event.code !== 1000) {
          resolve({
            success: false,
            message: `Connection closed unexpectedly. Code: ${event.code}`,
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
