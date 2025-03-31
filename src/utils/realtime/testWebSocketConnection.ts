
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
      
      // Create a WebSocket connection with protocols - crucial for OpenAI
      // OpenAI's documentation mentions json and specific protocols
      const protocols = ['json', 'openai-realtime'];
      console.log("[testWebSocketConnection] Using protocols:", protocols.join(', '));
      
      // Try connection without protocol first as a baseline test
      console.log("[testWebSocketConnection] First attempting connection without protocols");
      const basicWs = new WebSocket(wsUrl);
      basicWs.binaryType = "arraybuffer";
      
      const basicTimeoutId = setTimeout(() => {
        console.error("[testWebSocketConnection] Basic connection timed out after 5 seconds");
        try {
          basicWs.close();
        } catch (e) {
          console.error("[testWebSocketConnection] Error closing basic socket after timeout:", e);
        }
        
        // After basic connection times out, try with protocols
        console.log("[testWebSocketConnection] Now trying with specific protocols");
        tryWithProtocols();
      }, 5000);
      
      basicWs.onopen = () => {
        clearTimeout(basicTimeoutId);
        console.log("[testWebSocketConnection] Basic connection established successfully");
        
        try {
          basicWs.send(JSON.stringify({
            type: "ping",
            message: "Basic connection test",
            timestamp: new Date().toISOString()
          }));
          console.log("[testWebSocketConnection] Sent basic test ping message");
        } catch (sendError) {
          console.error("[testWebSocketConnection] Error sending basic test message:", sendError);
        }
        
        setTimeout(() => {
          try {
            basicWs.close();
          } catch (e) {
            console.error("[testWebSocketConnection] Error closing basic connection:", e);
          }
          
          // After successfully testing basic connection, try with protocols
          tryWithProtocols();
        }, 1000);
      };
      
      basicWs.onerror = (error) => {
        clearTimeout(basicTimeoutId);
        console.error("[testWebSocketConnection] Basic WebSocket error:", error);
        
        // If basic connection failed, try with protocols
        tryWithProtocols();
      };
      
      basicWs.onclose = (event) => {
        clearTimeout(basicTimeoutId);
        console.log(`[testWebSocketConnection] Basic connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
      };
      
      basicWs.onmessage = (event) => {
        console.log("[testWebSocketConnection] Received message on basic connection:", 
          typeof event.data === 'string' ? event.data : "Binary data");
      };
      
      // Function to test connection with specific protocols
      const tryWithProtocols = () => {
        console.log("[testWebSocketConnection] Testing with specific protocols:", protocols);
        
        // Try connection with specific protocol
        const ws = new WebSocket(wsUrl, protocols);
        ws.binaryType = "arraybuffer";
        
        console.log("[testWebSocketConnection] Protocol WebSocket created, initial readyState:", ws.readyState);
        
        // Set timeout for connection
        const timeoutId = setTimeout(() => {
          console.error("[testWebSocketConnection] Protocol connection timed out after 15 seconds");
          try {
            ws.close();
          } catch (e) {
            console.error("[testWebSocketConnection] Error closing protocol socket after timeout:", e);
          }
          resolve({
            success: false,
            message: "Connection timed out after 15 seconds. The server might not support the protocols ['json', 'openai-realtime']. Try without protocols or check Supabase Edge Function logs.",
            close: () => {}
          });
        }, 15000);
        
        // Log readyState changes for debugging
        const stateInterval = setInterval(() => {
          if (ws) {
            console.log("[testWebSocketConnection] Protocol socket readyState:", ws.readyState);
          } else {
            clearInterval(stateInterval);
          }
        }, 1000);
        
        // Handle connection events
        ws.onopen = () => {
          clearTimeout(timeoutId);
          clearInterval(stateInterval);
          console.log("[testWebSocketConnection] Protocol connection established successfully");
          console.log("[testWebSocketConnection] Selected protocol:", ws.protocol || "none");
          
          try {
            ws.send(JSON.stringify({
              type: "ping",
              message: "Protocol connection test",
              timestamp: new Date().toISOString()
            }));
            console.log("[testWebSocketConnection] Sent protocol test ping message");
          } catch (sendError) {
            console.error("[testWebSocketConnection] Error sending protocol test message:", sendError);
          }
          
          // Send an auth message if protocol suggests OpenAI connection
          if (ws.protocol && ws.protocol.includes('openai')) {
            try {
              console.log("[testWebSocketConnection] Detected OpenAI protocol, sending mock auth message");
              ws.send(JSON.stringify({
                type: "auth",
                authorization: "Bearer test_token" // Just for testing the protocol handling
              }));
            } catch (authError) {
              console.error("[testWebSocketConnection] Error sending mock auth message:", authError);
            }
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
          console.log("[testWebSocketConnection] Received protocol message:", 
            typeof event.data === 'string' ? event.data : "Binary data");
          try {
            const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            console.log("[testWebSocketConnection] Parsed protocol message data:", data);
          } catch (e) {
            // Non-JSON message, just log it
            console.log("[testWebSocketConnection] Received non-JSON protocol message");
          }
        };
        
        ws.onerror = (error) => {
          clearTimeout(timeoutId);
          clearInterval(stateInterval);
          console.error("[testWebSocketConnection] Protocol WebSocket error:", error);
          
          resolve({
            success: false,
            message: `WebSocket connection with protocols failed. The server might not support the protocols ['json', 'openai-realtime']. Check Supabase Edge Function logs.`,
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
          clearInterval(stateInterval);
          console.log(
            `[testWebSocketConnection] Protocol connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`
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
