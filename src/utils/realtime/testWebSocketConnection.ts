
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
      
      // Create a WebSocket connection with protocols
      const protocols = ['json', 'openai-realtime'];
      console.log("[testWebSocketConnection] Using protocols:", protocols.join(', '));
      
      // Try connection with specific protocol first
      const ws = new WebSocket(wsUrl, protocols);
      ws.binaryType = "arraybuffer";
      
      console.log("[testWebSocketConnection] WebSocket created, waiting for connection...");
      console.log("[testWebSocketConnection] Initial readyState:", ws.readyState);
      
      // Set timeout for connection
      const timeoutId = setTimeout(() => {
        console.error("[testWebSocketConnection] Connection timed out after 15 seconds");
        try {
          ws.close();
        } catch (e) {
          console.error("[testWebSocketConnection] Error closing socket after timeout:", e);
        }
        resolve({
          success: false,
          message: "Connection timed out after 15 seconds. Check Supabase Edge Function logs for errors. This may be due to network issues, CORS problems, or server configuration issues.",
          close: () => {}
        });
      }, 15000); // Longer timeout for slower connections
      
      // Log readyState changes
      const stateInterval = setInterval(() => {
        if (ws) {
          console.log("[testWebSocketConnection] Current readyState:", ws.readyState);
        } else {
          clearInterval(stateInterval);
        }
      }, 1000);
      
      // Handle connection events
      ws.onopen = () => {
        clearTimeout(timeoutId);
        clearInterval(stateInterval);
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
            clearInterval(stateInterval);
            try {
              ws.close();
            } catch (e) {
              console.error("[testWebSocketConnection] Error closing connection:", e);
            }
          }
        });
      };
      
      ws.onmessage = (event) => {
        console.log("[testWebSocketConnection] Received message:", typeof event.data === 'string' ? event.data : "Binary data");
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          console.log("[testWebSocketConnection] Parsed message data:", data);
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
        clearInterval(stateInterval);
        console.error("[testWebSocketConnection] WebSocket error:", error);
        
        // Try without protocols after error
        console.log("[testWebSocketConnection] Error with protocol, retrying without protocol");
        try {
          ws.close();
        } catch (e) {
          console.error("[testWebSocketConnection] Error closing socket after error:", e);
        }
        
        // Retry without protocols
        console.log("[testWebSocketConnection] Attempting connection without protocols");
        const basicWs = new WebSocket(wsUrl);
        basicWs.binaryType = "arraybuffer";
        
        console.log("[testWebSocketConnection] Fallback WebSocket created, waiting for connection...");
        
        // Set timeout for fallback connection
        const fallbackTimeoutId = setTimeout(() => {
          console.error("[testWebSocketConnection] Fallback connection timed out");
          clearInterval(fallbackStateInterval);
          resolve({
            success: false,
            message: "WebSocket connection failed with and without protocols. Check Supabase Edge Function logs for errors. The server may not be available or may be misconfigured.",
            close: () => {}
          });
        }, 10000);
        
        // Log readyState changes for fallback connection
        const fallbackStateInterval = setInterval(() => {
          if (basicWs) {
            console.log("[testWebSocketConnection] Fallback readyState:", basicWs.readyState);
          } else {
            clearInterval(fallbackStateInterval);
          }
        }, 1000);
        
        basicWs.onopen = () => {
          clearTimeout(fallbackTimeoutId);
          clearInterval(fallbackStateInterval);
          console.log("[testWebSocketConnection] Connection without protocol established successfully");
          resolve({
            success: true,
            message: "WebSocket connection established successfully without protocols",
            close: () => {
              console.log("[testWebSocketConnection] Closing fallback WebSocket connection");
              try {
                basicWs.close();
              } catch (e) {
                console.error("[testWebSocketConnection] Error closing fallback connection:", e);
              }
            }
          });
        };
        
        basicWs.onerror = (fallbackError) => {
          clearTimeout(fallbackTimeoutId);
          clearInterval(fallbackStateInterval);
          console.error("[testWebSocketConnection] Both connection attempts failed:", fallbackError);
          resolve({
            success: false,
            message: "WebSocket connection failed with and without protocols. Check your network connection and Supabase Edge Function logs. Possible issues: CORS configuration, WebSocket upgrade handling, or server errors.",
            close: () => {}
          });
        };
        
        basicWs.onclose = (event) => {
          clearTimeout(fallbackTimeoutId);
          clearInterval(fallbackStateInterval);
          console.log(`[testWebSocketConnection] Fallback connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
        };
      };
      
      ws.onclose = (event) => {
        clearTimeout(timeoutId);
        clearInterval(stateInterval);
        console.log(
          `[testWebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`
        );
        
        if (!event.wasClean) {
          resolve({
            success: false,
            message: `Connection closed unexpectedly (Code: ${event.code}). This might indicate server-side issues, network problems, or CORS issues.`,
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
