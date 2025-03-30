
/**
 * Test function for realtime endpoints
 */
export const testRealtimeEndpoint = async (url: string): Promise<{success: boolean, message: string}> => {
  console.log(`[testRealtimeEndpoint] Testing WebSocket connection to: ${url}`);
  
  return new Promise((resolve) => {
    try {
      // Create a WebSocket connection
      const ws = new WebSocket(url);
      
      // Set a timeout in case the connection hangs
      const timeout = setTimeout(() => {
        console.error(`[testRealtimeEndpoint] Connection timed out after 5 seconds`);
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
        }
        resolve({success: false, message: "Connection timed out after 5 seconds"});
      }, 5000);
      
      // Handle successful connection
      ws.onopen = () => {
        console.log(`[testRealtimeEndpoint] Connection established successfully`);
        clearTimeout(timeout);
        
        // Send a test message
        try {
          ws.send(JSON.stringify({type: "test", message: "Test connection"}));
          console.log(`[testRealtimeEndpoint] Test message sent`);
        } catch (sendError) {
          console.error(`[testRealtimeEndpoint] Error sending test message:`, sendError);
        }
        
        // Close the connection after a brief delay
        setTimeout(() => {
          ws.close();
          resolve({success: true, message: "Connection test successful"});
        }, 1000);
      };
      
      // Handle connection errors
      ws.onerror = (error) => {
        console.error(`[testRealtimeEndpoint] Connection error:`, error);
        clearTimeout(timeout);
        resolve({success: false, message: "Connection error"});
      };
      
      // Handle messages (optional)
      ws.onmessage = (event) => {
        console.log(`[testRealtimeEndpoint] Received message:`, event.data);
      };
      
      // Handle connection closure
      ws.onclose = (event) => {
        console.log(`[testRealtimeEndpoint] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
        clearTimeout(timeout);
      };
    } catch (error) {
      console.error(`[testRealtimeEndpoint] Error creating WebSocket:`, error);
      resolve({success: false, message: `Error: ${error instanceof Error ? error.message : String(error)}`});
    }
  });
};
