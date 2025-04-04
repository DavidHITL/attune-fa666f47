
/**
 * Enhanced context loader - handles Phase 2 loading with full context
 * This provides comprehensive context once the connection is established
 */
import { enhanceInstructionsWithContext } from "./enhanceInstructions";
import { logContextVerification } from "./contextVerification";

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
    console.log(`[UnifiedContext] [Phase2] [ContextLoad] Starting enhanced instruction load`);
    
    if (params.userId) {
      console.log(`[UnifiedContext] [Phase2] [ContextLoad] Loading full context for user: ${params.userId.substring(0, 8)}...`);
      
      // Use the enhanceInstructionsWithContext function to add context to the instructions
      // Add a timeout to prevent blocking if context enhancement takes too long
      const enhancementPromise = enhanceInstructionsWithContext(baseInstructions, params.userId);
      
      // Set a timeout to prevent blocking
      const timeoutPromise = new Promise<string>((resolve) => {
        setTimeout(() => {
          console.warn("[UnifiedContext] [Phase2] [ContextLoad] [WARNING] Context enhancement timed out, using basic instructions");
          resolve(baseInstructions);
        }, 3000); // 3 second timeout (increased from 2.5s)
      });
      
      // Race the enhancement against the timeout
      console.log("[UnifiedContext] [Phase2] [ContextLoad] Waiting for context enhancement (with 3s timeout)");
      const enhancedInstructions = await Promise.race([enhancementPromise, timeoutPromise]);
      
      // Log that we enhanced the instructions for this user
      console.log(`[UnifiedContext] [Phase2] [ContextLoad] Enhanced instructions for user ${params.userId} in ${params.activeMode} mode`);
      console.log(`[UnifiedContext] [Phase2] [ContextLoad] Instructions size: ${enhancedInstructions.length} characters`);
      
      // Log context verification without awaiting it
      logContextVerification(params, baseInstructions).catch(err => {
        // Don't let logging errors disrupt the main flow
        console.error("[UnifiedContext] [ContextLoad] [ERROR] Error in context verification logging:", err);
      });
      
      return enhancedInstructions;
    } else {
      console.log("[UnifiedContext] [Phase2] [ContextLoad] No userId provided, using base instructions for guest mode");
      
      // For guest users without userId, just use the base instructions
      return `${baseInstructions}\n\nThis is a guest session with limited personalization.`;
    }
  } catch (error) {
    console.error("[UnifiedContext] [Phase2] [ContextLoad] [ERROR] Error enhancing instructions with unified context:", error);
    console.error("[UnifiedContext] [Phase2] [ContextLoad] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    // Return the original instructions if enhancement fails
    return baseInstructions;
  }
}
