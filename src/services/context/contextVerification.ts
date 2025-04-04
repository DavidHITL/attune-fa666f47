
/**
 * Context verification and tracking - handles logging and verification of context data
 * This provides insights into context usage and transitions between interaction modes
 */
import { fetchUserContext } from "./index";

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
