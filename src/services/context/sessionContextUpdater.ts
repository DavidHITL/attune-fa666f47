
/**
 * Session context updater - handles sending full context through data channel
 * This updates the active session with comprehensive context
 */
import { getUnifiedEnhancedInstructions } from "./enhancedContextLoader";

/**
 * Update session context after connection is established
 * This sends a context update message through the data channel
 */
export async function updateSessionWithFullContext(
  dataChannel: RTCDataChannel,
  baseInstructions: string,
  params: {
    userId?: string;
    activeMode: 'text' | 'voice';
    sessionStarted: boolean;
  }
): Promise<boolean> {
  try {
    console.log("[UnifiedContext] [Phase2] [DataChannel] Starting context update process");
    
    // Early validation checks
    if (dataChannel.readyState !== 'open') {
      console.error(`[UnifiedContext] [Phase2] [DataChannel] [ERROR] Cannot update context: Data channel not open, state: ${dataChannel.readyState}`);
      return false;
    }
    
    console.log(`[UnifiedContext] [Phase2] [DataChannel] Data channel is open (${dataChannel.label}), ready for context update`);
    
    // Log whether we have a userId for context enrichment
    if (params.userId) {
      console.log(`[UnifiedContext] [Phase2] [ContextLoad] Loading full context for user: ${params.userId.substring(0, 8)}...`);
    } else {
      console.log("[UnifiedContext] [Phase2] [ContextLoad] No userId available - proceeding with guest session");
    }
    
    try {
      // Get the enhanced instructions with full context
      console.log("[UnifiedContext] [Phase2] [ContextLoad] Getting enhanced instructions");
      const fullEnhancedInstructions = await getUnifiedEnhancedInstructions(
        baseInstructions,
        {
          ...params,
          sessionProgress: 0
        }
      );
      
      // Send the context update message through the data channel
      const contextUpdateMessage = {
        type: "session.update",
        event_id: `session_update_${Date.now()}`,
        session: {
          instructions: fullEnhancedInstructions
        }
      };
      
      // Double-check the channel is still open before attempting to send
      if (dataChannel.readyState === 'open') {
        try {
          console.log(`[UnifiedContext] [Phase2] [ContextSend] Sending context update through data channel (${dataChannel.label})`);
          console.log(`[UnifiedContext] [Phase2] [ContextSend] Context size: ${fullEnhancedInstructions.length} characters`);
          console.log(`[UnifiedContext] [Phase2] [ContextSend] Data channel buffer amount: ${dataChannel.bufferedAmount} bytes`);
          
          const messageJson = JSON.stringify(contextUpdateMessage);
          console.log(`[UnifiedContext] [Phase2] [ContextSend] Message size: ${messageJson.length} bytes`);
          
          dataChannel.send(messageJson);
          console.log("[UnifiedContext] [Phase2] [ContextSend] Context update sent successfully");
          
          // Create a promise that resolves on message acknowledgement or timeout
          const contextUpdateSuccessful = await new Promise<boolean>((resolve) => {
            // We'll resolve after a short timeout as there's no direct ack
            setTimeout(() => {
              if (dataChannel.readyState === 'open') {
                console.log("[UnifiedContext] [Phase2] [ContextSend] Full context update presumed successful (no errors)");
                resolve(true);
              } else {
                console.warn("[UnifiedContext] [Phase2] [ContextSend] [WARNING] Data channel closed after sending context");
                resolve(false);
              }
            }, 1000); // Increased delay to ensure message is processed
            
            // Also listen for a message that might indicate success
            const messageHandler = (event: MessageEvent) => {
              try {
                const response = JSON.parse(event.data);
                if (response.type === 'session.updated') {
                  console.log("[UnifiedContext] [Phase2] [ContextSend] Received session.updated confirmation");
                  dataChannel.removeEventListener('message', messageHandler);
                  resolve(true);
                }
              } catch (e) {
                // Ignore parsing errors
              }
            };
            
            // Only add listener if channel is open
            if (dataChannel.readyState === 'open') {
              dataChannel.addEventListener('message', messageHandler);
              
              // Remove listener after timeout
              setTimeout(() => {
                dataChannel.removeEventListener('message', messageHandler);
              }, 3000); // Increased timeout
            }
          });
          
          return contextUpdateSuccessful;
        } catch (error) {
          console.error("[UnifiedContext] [Phase2] [ContextSend] [ERROR] Error sending context through data channel:", error);
          console.error("[UnifiedContext] [Phase2] [ContextSend] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
          return false;
        }
      } else {
        console.warn(`[UnifiedContext] [Phase2] [DataChannel] [ERROR] Data channel closed (${dataChannel.readyState}) before context could be sent`);
        return false;
      }
    } catch (error) {
      console.error("[UnifiedContext] [Phase2] [ContextSend] [ERROR] Error loading and sending full context:", error);
      console.error("[UnifiedContext] [Phase2] [ContextSend] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
      return false;
    }
  } catch (error) {
    console.error("[UnifiedContext] [Phase2] [ContextSend] [ERROR] Error updating session with full context:", error);
    console.error("[UnifiedContext] [Phase2] [ContextSend] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    return false;
  }
}
