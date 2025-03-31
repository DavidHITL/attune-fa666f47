
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
      
      // Create a WebSocket connection with protocols
      const protocols = ['json', 'openai-realtime'];
      console.log("[testCompleteChatFlow] Using protocols:", protocols.join(', '));
      const ws = new WebSocket(wsUrl, protocols);
      ws.binaryType = "arraybuffer";
      
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
        console.log("[testCompleteChatFlow] Selected protocol:", ws.protocol || "none");
        
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
            message: `Chat flow test initiated${ws.protocol ? ` with protocol: ${ws.protocol}` : ''}`,
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
          
          if (data && data.type === "connection.established") {
            console.log("[testCompleteChatFlow] Server confirmed connection");
          }
        } catch (parseError) {
          console.log("[testCompleteChatFlow] Could not parse message as JSON, raw data:", event.data);
        }
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeoutId);
        console.error("[testCompleteChatFlow] WebSocket error:", error);
        
        // If connection with protocol failed, try without protocol
        if (ws.protocol) {
          console.log("[testCompleteChatFlow] Error with protocol, retrying without protocol");
          try {
            ws.close();
          } catch (e) {
            // Ignore close errors
          }
          
          // Try without protocols
          const basicWs = new WebSocket(wsUrl);
          basicWs.binaryType = "arraybuffer";
          
          basicWs.onopen = () => {
            clearTimeout(timeoutId);
            console.log("[testCompleteChatFlow] Connection without protocol established successfully");
            
            // Send session initialization without protocols
            try {
              basicWs.send(JSON.stringify({
                type: "session_init",
                message: "Initialize session without protocols",
                data: { 
                  userId: "test-user-id",
                  sessionId: `test-session-basic-${Date.now()}`
                }
              }));
              
              resolve({
                success: true,
                message: "Chat flow test initiated without protocols",
                close: () => {
                  console.log("[testCompleteChatFlow] Closing fallback WebSocket connection");
                  try {
                    basicWs.close();
                  } catch (e) {
                    // Ignore close errors
                  }
                }
              });
            } catch (sendError) {
              console.error("[testCompleteChatFlow] Error sending init message without protocols:", sendError);
              resolve({
                success: false,
                message: `Error without protocols: ${sendError instanceof Error ? sendError.message : String(sendError)}`,
                close: () => {
                  try {
                    basicWs.close();
                  } catch (e) {
                    // Ignore close errors
                  }
                }
              });
            }
          };
          
          basicWs.onerror = () => {
            console.error("[testCompleteChatFlow] Both connection attempts failed");
            resolve({
              success: false,
              message: "WebSocket connection failed with and without protocols. Check browser console and server logs for details.",
              close: () => {}
            });
          };
          
          return; // Exit this error handler since we're trying a new connection
        }
        
        resolve({
          success: false,
          message: "WebSocket connection error occurred. Check browser console for details.",
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
        
        if (!event.wasClean && event.code !== 1000) {
          resolve({
            success: false,
            message: `Connection closed unexpectedly (Code: ${event.code}). This might be due to CORS or server configuration issues.`,
            close: () => {}
          });
        }
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
