
/**
 * Utility to test the Supabase edge function reachability
 */
export const testRealtimeFunctionEndpoint = async (): Promise<{success: boolean; message: string}> => {
  try {
    const projectId = 'oseowhythgbqvllwonaz';
    const endpoint = `https://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log("[TestEndpoint] Testing HTTP accessibility of realtime-chat function:", endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.json();
    
    console.log("[TestEndpoint] Response status:", response.status);
    console.log("[TestEndpoint] Response data:", data);
    
    return {
      success: response.status >= 200 && response.status < 300,
      message: `Endpoint responded with status ${response.status}: ${JSON.stringify(data)}`
    };
  } catch (error) {
    console.error("[TestEndpoint] Error testing endpoint:", error);
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};

/**
 * Utility to test WebSocket connection to the edge function
 */
export const testWebSocketConnection = (): {
  success: boolean;
  message: string;
  close: () => void;
} => {
  try {
    const projectId = 'oseowhythgbqvllwonaz';
    const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log("[TestEndpoint] Testing WebSocket connection:", wsUrl);
    
    const socket = new WebSocket(wsUrl);
    let connected = false;
    
    // Set up event listeners
    socket.addEventListener('open', () => {
      connected = true;
      console.log("[TestEndpoint] WebSocket connection established successfully!");
    });
    
    socket.addEventListener('error', (event) => {
      console.error("[TestEndpoint] WebSocket connection error:", event);
    });
    
    // Return an object with the socket status and a close method
    return {
      success: true,
      message: "WebSocket connection attempt started. Check console for results.",
      close: () => {
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close();
          console.log("[TestEndpoint] WebSocket connection closed");
        }
      }
    };
  } catch (error) {
    console.error("[TestEndpoint] Error creating WebSocket:", error);
    return {
      success: false,
      message: `Error creating WebSocket: ${error instanceof Error ? error.message : String(error)}`,
      close: () => {} // Empty function as there's no socket to close
    };
  }
};
