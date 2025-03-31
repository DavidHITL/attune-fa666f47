
/**
 * Tests the complete chat flow with the realtime endpoint
 */
export const testCompleteChatFlow = async (): Promise<{success: boolean, message: string, close: () => void}> => {
  console.log("[testCompleteChatFlow] Starting complete chat flow test");
  
  return new Promise((resolve) => {
    try {
      // Use the correct project ID
      const projectId = 'oseowhythgbqvllwonaz';
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/realtime-chat`;
      
      console.log("[testCompleteChatFlow] Connecting to:", wsUrl);
      
      // Create a WebSocket connection - try without protocols first
      const ws = new WebSocket(wsUrl);
      
      // Set a timeout for connection
      const timeoutId = setTimeout(() => {
        console.error("[testCompleteChatFlow] Connection timed out after 5 seconds");
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
        console.log("[testCompleteChatFlow] Connection established successfully");
        
        // Send session initialization message
        try {
          ws.send(JSON.stringify({
            type: "session_init",
            message: "Initialize session",
            data: { 
              userId: "test-user-id",
              sessionId: `test-session-${Date.now()}`
            }
          }));
          console.log("[testCompleteChatFlow] Sent session initialization message");
          
          // After a short delay, send a test message
          setTimeout(() => {
            try {
              ws.send(JSON.stringify({
                type: "chat_message",
                message: "Hello, this is a test message from the complete chat flow test"
              }));
              console.log("[testCompleteChatFlow] Sent test chat message");
            } catch (sendError) {
              console.error("[testCompleteChatFlow] Error sending chat message:", sendError);
            }
          }, 1000);
          
          resolve({
            success: true,
            message: "Chat flow test initiated",
            close: () => {
              console.log("[testCompleteChatFlow] Manually closing WebSocket connection");
              try {
                ws.close();
              } catch (e) {
                // Ignore close errors
              }
            }
          });
        } catch (sendError) {
          console.error("[testCompleteChatFlow] Error sending session init message:", sendError);
          resolve({
            success: false,
            message: `Error sending init message: ${sendError instanceof Error ? sendError.message : String(sendError)}`,
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
      
      ws.onmessage = (event) => {
        console.log("[testCompleteChatFlow] Received message:", event.data);
        try {
          const data = JSON.parse(event.data);
          console.log("[testCompleteChatFlow] Parsed message data:", data);
        } catch (parseError) {
          console.log("[testCompleteChatFlow] Could not parse message as JSON, raw data:", event.data);
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("[testCompleteChatFlow] WebSocket error:", error);
        
        // If first attempt failed, try with protocols
        if (!ws.protocol) {
          console.log("[testCompleteChatFlow] Retrying with protocols...");
          try {
            ws.close();
          } catch (e) {
            // Ignore close errors
          }
          
          // Try with protocols
          const protocolWs = new WebSocket(wsUrl, ['json', 'openai-realtime']);
          
          protocolWs.onopen = () => {
            clearTimeout(timeoutId);
            console.log("[testCompleteChatFlow] Connection with protocols established");
            console.log("[testCompleteChatFlow] Selected protocol:", protocolWs.protocol || "none");
            
            // Send session initialization with protocols
            try {
              protocolWs.send(JSON.stringify({
                type: "session_init",
                message: "Initialize session with protocols",
                data: { 
                  userId: "test-user-id",
                  sessionId: `test-session-protocol-${Date.now()}`
                }
              }));
              
              resolve({
                success: true,
                message: "Chat flow test initiated with protocols",
                close: () => {
                  console.log("[testCompleteChatFlow] Manually closing protocol WebSocket connection");
                  try {
                    protocolWs.close();
                  } catch (e) {
                    // Ignore close errors
                  }
                }
              });
            } catch (sendError) {
              console.error("[testCompleteChatFlow] Error sending init message with protocols:", sendError);
              resolve({
                success: false,
                message: `Error with protocols: ${sendError instanceof Error ? sendError.message : String(sendError)}`,
                close: () => {
                  try {
                    protocolWs.close();
                  } catch (e) {
                    // Ignore close errors
                  }
                }
              });
            }
          };
          
          protocolWs.onerror = () => {
            clearTimeout(timeoutId);
            console.error("[testCompleteChatFlow] WebSocket failed with and without protocols");
            
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
          `[testCompleteChatFlow] Connection closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`
        );
      };
    } catch (error) {
      console.error("[testCompleteChatFlow] Error creating WebSocket:", error);
      resolve({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
        close: () => {} // No-op for failed connections
      });
    }
  });
};
