
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
      console.log("[testWebSocketConnection] Browser WebSocket support:", typeof WebSocket !== 'undefined' ? 'Available' : 'Not Available');
      
      // Connection timeout handling
      const timeoutId = setTimeout(() => {
        console.error("[testWebSocketConnection] Connection timed out after 15 seconds");
        resolve({
          success: false,
          message: "Connection timed out after 15 seconds. The server might not be responding or is unable to upgrade to WebSocket.",
          close: () => {}
        });
      }, 15000);
      
      // Create WebSocket connection without protocols first (simpler approach)
      const ws = new WebSocket(wsUrl);
      
      // Log all state changes for debugging
      ws.onopen = () => {
        clearTimeout(timeoutId);
        console.log("[testWebSocketConnection] Connection established successfully");
        
        // Send a ping message to test message sending
        try {
          ws.send(JSON.stringify({ type: "ping", timestamp: new Date().toISOString() }));
          console.log("[testWebSocketConnection] Ping message sent successfully");
        } catch (sendError) {
          console.error("[testWebSocketConnection] Failed to send ping message:", sendError);
        }
        
        resolve({
          success: true,
          message: `WebSocket connection established successfully. Ready state: ${ws.readyState}`,
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
          
          // If we get a response, that's already a good sign
          if (!timeoutId._destroyed) {
            clearTimeout(timeoutId);
            resolve({
              success: true,
              message: `WebSocket connection success! Received message: ${JSON.stringify(data)}`,
              close: () => {
                console.log("[testWebSocketConnection] Closing connection after receiving message");
                ws.close();
              }
            });
          }
        } catch (e) {
          console.log("[testWebSocketConnection] Received non-JSON message:", event.data);
        }
      };
      
      ws.onerror = (error) => {
        console.error("[testWebSocketConnection] WebSocket error:", error);
        
        // If error includes a status code, it's likely a HTTP error during upgrade
        const errorMessage = error instanceof ErrorEvent && error.message 
          ? `WebSocket connection failed: ${error.message}`
          : "WebSocket connection failed. Check browser console for details.";
        
        // Only resolve if not resolved yet
        if (!timeoutId._destroyed) {
          clearTimeout(timeoutId);
          resolve({
            success: false,
            message: errorMessage + " This often means the Edge Function failed to upgrade the connection properly.",
            close: () => {
              try {
                ws.close();
              } catch (e) {
                // Ignore close errors
              }
            }
          });
        }
      };
      
      ws.onclose = (event) => {
        console.log(
          `[testWebSocketConnection] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`
        );
        
        if (!timeoutId._destroyed) {
          clearTimeout(timeoutId);
          
          if (!event.wasClean) {
            resolve({
              success: false,
              message: `Connection closed unexpectedly (Code: ${event.code}). This might indicate CORS problems or an error in the Edge Function.`,
              close: () => {}
            });
          } else {
            resolve({
              success: true,
              message: `Connection successfully closed (Code: ${event.code})`,
              close: () => {}
            });
          }
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
