
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
      
      // Create a WebSocket connection with protocols
      const protocols = ['json', 'openai-realtime'];
      console.log("[testWebSocketConnection] Using protocols:", protocols.join(', '));
      
      // Try connection with specific protocol first
      const ws = new WebSocket(wsUrl, protocols);
      ws.binaryType = "arraybuffer";
      
      // Set timeout for connection
      const timeoutId = setTimeout(() => {
        console.error("[testWebSocketConnection] Connection timed out after 10 seconds");
        try {
          ws.close();
        } catch (e) {
          // Ignore close errors
        }
        resolve({
          success: false,
          message: "Connection timed out after 10 seconds. This may be due to network issues or server configuration problems.",
          close: () => {}
        });
      }, 10000); // Longer timeout for slower connections
      
      // Handle connection events
      ws.onopen = () => {
        clearTimeout(timeoutId);
        console.log("[testWebSocketConnection] Connection established successfully");
        console.log("[testWebSocketConnection] Selected protocol:", ws.protocol || "none");
        
        try {
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
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
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
        
        // Try without protocols after error
        console.log("[testWebSocketConnection] Error with protocol, retrying without protocol");
        try {
          ws.close();
        } catch (e) {
          // Ignore close errors
        }
        
        // Retry without protocols
        console.log("[testWebSocketConnection] Attempting connection without protocols");
        const basicWs = new WebSocket(wsUrl);
        basicWs.binaryType = "arraybuffer";
        
        // Set timeout for fallback connection
        const fallbackTimeoutId = setTimeout(() => {
          console.error("[testWebSocketConnection] Fallback connection timed out");
          resolve({
            success: false,
            message: "WebSocket connection failed with and without protocols. The server may not be available or may be misconfigured.",
            close: () => {}
          });
        }, 8000);
        
        basicWs.onopen = () => {
          clearTimeout(fallbackTimeoutId);
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
          clearTimeout(fallbackTimeoutId);
          console.error("[testWebSocketConnection] Both connection attempts failed");
          resolve({
            success: false,
            message: "WebSocket connection failed with and without protocols. Check your network connection and server logs.",
            close: () => {}
          });
        };
      };
      
      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        console.log(
          `[testWebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`
        );
        
        if (!event.wasClean) {
          resolve({
            success: false,
            message: `Connection closed unexpectedly (Code: ${event.code}). This might indicate server-side issues or network problems.`,
            close: () => {}
          });
        }
      };
    } catch (error) {
      console.error("[testWebSocketConnection] Error creating WebSocket:", error);
      resolve({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        close: () => {}
      });
    }
  });
};
