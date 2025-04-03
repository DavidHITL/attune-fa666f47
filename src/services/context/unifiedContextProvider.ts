
// Import only parts being modified to fix the userId error
import { MessageMetadata } from "@/services/messages/messageUtils";
import { enhanceInstructionsWithContext } from "./enhanceInstructions";
import { fetchUserContext } from "./index";

/**
 * Get minimal instructions for initial connection
 * This is phase 1 - fast and lightweight instructions for quick connection
 */
export async function getMinimalInstructions(
  baseInstructions: string,
  params: {
    userId?: string;
    activeMode: 'text' | 'voice';
  }
): Promise<string> {
  try {
    // For a quick connection, just add some minimal context
    // This ensures the connection isn't blocked by heavy context loading
    console.log(`[UnifiedContext] [Phase1] Getting minimal instructions for ${params.userId || 'anonymous'}`);
    
    // Return the basic instructions with a note about pending context
    return params.userId 
      ? `${baseInstructions}\n\nAdditional context for user ${params.userId.substring(0, 8)}... will be loaded shortly.`
      : baseInstructions;
  } catch (error) {
    console.error("[UnifiedContext] [ContextLoadError] [Phase1] Error getting minimal instructions:", error);
    // Even on error, return something rather than failing
    return baseInstructions;
  }
}

/**
 * Get unified enhanced instructions with context
 * This is phase 2 - full context enrichment once connection is established
 */
export async function getUnifiedEnhancedInstructions(
  baseInstructions: string,
  params: {
    userId?: string;
    activeMode: 'text' | 'voice';
    sessionStarted: boolean;
    sessionProgress?: number;
  }
): Promise<string> {
  try {
    console.log(`[UnifiedContext] [Phase2] Loading full context for ${params.userId || 'anonymous'}`);
    
    // Validate userId before proceeding - but don't block the process
    if (!params.userId) {
      console.warn("[UnifiedContext] [ContextLoadError] [Phase2] Missing userId in params - using basic instructions without context");
      // Return original instructions if no userId without throwing error
      return baseInstructions;
    }
    
    console.log(`[UnifiedContext] [Phase2] Beginning context enhancement for user ${params.userId}`);
    
    // Use the enhanceInstructionsWithContext function to add context to the instructions
    // Add a timeout to prevent blocking if context enhancement takes too long
    const enhancementPromise = enhanceInstructionsWithContext(baseInstructions, params.userId);
    
    // Set a timeout to prevent blocking
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        console.warn("[UnifiedContext] [ContextLoadError] [Phase2] Context enhancement timed out, using basic instructions");
        resolve(baseInstructions);
      }, 2500); // 2.5 second timeout
    });
    
    // Race the enhancement against the timeout
    const enhancedInstructions = await Promise.race([enhancementPromise, timeoutPromise]);
    
    // Log that we enhanced the instructions for this user
    console.log(`[UnifiedContext] [Phase2] Enhanced instructions for user ${params.userId} in ${params.activeMode} mode`);
    
    // Log context verification without awaiting it
    logContextVerification(params, baseInstructions).catch(err => {
      // Don't let logging errors disrupt the main flow
      console.error("[UnifiedContext] [ContextLoadError] Error in context verification logging:", err);
    });
    
    return enhancedInstructions;
  } catch (error) {
    console.error("[UnifiedContext] [ContextLoadError] [Phase2] Error enhancing instructions with unified context:", error);
    // Return the original instructions if enhancement fails
    return baseInstructions;
  }
}

/**
 * Track transitions between different interaction modes (text/voice)
 */
export async function trackModeTransition(
  fromMode: string,
  toMode: string,
  userId?: string,
  transcript?: string
): Promise<void> {
  try {
    if (!userId) {
      console.warn("[UnifiedContext] Cannot track mode transition: No userId provided");
      return;
    }
    
    console.log(`[UnifiedContext] Mode transition from ${fromMode} to ${toMode} for user ${userId}`);
    
    // Additional implementation can be added as needed
    
  } catch (error) {
    console.error("[UnifiedContext] Error tracking mode transition:", error);
    // Swallow error, don't let it propagate
  }
}

/**
 * Log context verification for analytics and debugging
 */
export async function logContextVerification(
  params: {
    userId?: string;
    activeMode: 'text' | 'voice';
    sessionStarted: boolean;
    sessionProgress?: number;
  },
  systemPrompt?: string,
  additionalContext?: Record<string, any>
): Promise<void> {
  try {
    if (!params.userId) {
      console.warn("[UnifiedContext] Cannot log context verification: No userId provided");
      return;
    }
    
    // Fetch context to verify what was loaded - with a timeout
    const contextPromise = fetchUserContext(params.userId);
    const timeoutPromise = new Promise<null>((_, resolve) => {
      setTimeout(() => resolve(null), 1500);
    });
    
    const contextData = await Promise.race([contextPromise, timeoutPromise])
      .catch(() => null); // Catch any errors and continue
    
    // Log context verification with detailed information
    console.log(`[UnifiedContext] Context verification for ${params.userId} in ${params.activeMode} mode:`, {
      hasContext: !!contextData,
      messageCount: contextData?.recentMessages?.length || 0,
      hasInstructions: !!contextData?.userInstructions,
      knowledgeEntryCount: contextData?.knowledgeEntries?.length || 0,
      hasUserDetails: !!contextData?.userDetails,
      hasCriticalInfo: Array.isArray(contextData?.criticalInformation) && contextData?.criticalInformation.length > 0,
      hasAnalysisResults: !!contextData?.analysisResults,
      ...additionalContext
    });
    
  } catch (error) {
    console.error("[UnifiedContext] Error logging context verification:", error);
    // Don't let this error propagate
  }
}

/**
 * Get a summary of recent context
 */
export async function getRecentContextSummary(
  userId?: string
): Promise<string | null> {
  try {
    if (!userId) {
      console.warn("[UnifiedContext] Cannot get context summary: No userId provided");
      return null;
    }
    
    // Add a timeout to prevent blocking
    const contextPromise = fetchUserContext(userId);
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 2000);
    });
    
    // Race the context fetching against the timeout
    const contextData = await Promise.race([contextPromise, timeoutPromise])
      .catch(() => null);
      
    if (!contextData) {
      return "No context available or timed out loading context.";
    }
    
    return `Context summary: ${contextData.recentMessages?.length || 0} messages, ` +
      `${contextData.knowledgeEntries?.length || 0} knowledge entries, ` +
      `${contextData.userDetails ? "has user details" : "no user details"}, ` +
      `${contextData.analysisResults ? "has analysis" : "no analysis"}`;
  } catch (error) {
    console.error("[UnifiedContext] Error getting context summary:", error);
    return null;
  }
}

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
    if (dataChannel.readyState !== 'open') {
      console.warn("[UnifiedContext] [DataChannelError] Cannot update context: Data channel not open, state:", dataChannel.readyState);
      return false;
    }
    
    console.log("[UnifiedContext] [Phase2] Data channel is open, loading full context update");
    
    try {
      // Get the enhanced instructions with full context
      const fullEnhancedInstructions = await getUnifiedEnhancedInstructions(
        baseInstructions,
        params
      );
      
      // Send the context update message through the data channel
      const contextUpdateMessage = {
        type: "session.update",
        session: {
          instructions: fullEnhancedInstructions
        }
      };
      
      console.log("[UnifiedContext] [Phase2] Sending context update through data channel");
      dataChannel.send(JSON.stringify(contextUpdateMessage));
      
      console.log("[UnifiedContext] [Phase2] Full context update sent successfully");
      return true;
    } catch (error) {
      console.error("[UnifiedContext] [ContextLoadError] [Phase2] Error loading and sending full context:", error);
      return false;
    }
  } catch (error) {
    console.error("[UnifiedContext] [DataChannelError] Error updating session with full context:", error);
    return false;
  }
}
