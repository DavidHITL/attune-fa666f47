
/**
 * Utility to test WebSocket connection to the realtime chat endpoint
 */
export async function testWebSocketConnection(): Promise<{ success: boolean; message: string; close: () => void }> {
  return new Promise((resolve) => {
    try {
      console.log("[WebSocketTest] Starting connection test");
      
      // Get the Supabase project ID from the URL
      const projectId = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID || 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
      
      console.log(`[WebSocketTest] Connecting to ${wsUrl}`);
      
      const socket = new WebSocket(wsUrl);
      let timeoutId: number;
      
      // Set connection timeout
      timeoutId = window.setTimeout(() => {
        console.log("[WebSocketTest] Connection timeout");
        socket.close();
        resolve({ 
          success: false, 
          message: "Connection timed out after 10 seconds", 
          close: () => {} 
        });
      }, 10000);
      
      socket.onopen = () => {
        console.log("[WebSocketTest] Connection established");
        clearTimeout(timeoutId);
        
        // Send a test message
        try {
          socket.send(JSON.stringify({ type: "test", message: "Connection test" }));
        } catch (err) {
          console.error("[WebSocketTest] Error sending test message:", err);
        }
        
        resolve({ 
          success: true, 
          message: "Connection established successfully", 
          close: () => {
            try {
              if (socket.readyState === WebSocket.OPEN) {
                socket.close();
              }
            } catch (err) {
              console.error("[WebSocketTest] Error closing socket:", err);
            }
          } 
        });
      };
      
      socket.onerror = (event) => {
        console.error("[WebSocketTest] WebSocket error:", event);
        clearTimeout(timeoutId);
        resolve({ 
          success: false, 
          message: "Connection failed with error", 
          close: () => {
            try {
              if (socket.readyState !== WebSocket.CLOSED) {
                socket.close();
              }
            } catch (err) {
              console.error("[WebSocketTest] Error closing socket:", err);
            }
          } 
        });
      };
      
      socket.onclose = (event) => {
        console.log("[WebSocketTest] Connection closed:", event);
      };
      
      socket.onmessage = (event) => {
        console.log("[WebSocketTest] Received message:", event.data);
      };
    } catch (error) {
      console.error("[WebSocketTest] Error during test:", error);
      resolve({ 
        success: false, 
        message: `Test error: ${error instanceof Error ? error.message : String(error)}`, 
        close: () => {} 
      });
    }
  });
}
