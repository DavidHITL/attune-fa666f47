
/**
 * Initial context loader - handles Phase 1 loading with minimal context
 * This provides fast, lightweight context for quick connection establishment
 */
import { logContextVerification } from "./contextVerification";

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
    console.log(`[UnifiedContext] [Phase1] [ContextLoad] Starting minimal instruction load`);
    
    // For a quick connection, just add some minimal context
    // This ensures the connection isn't blocked by heavy context loading
    if (params.userId) {
      console.log(`[UnifiedContext] [Phase1] [ContextLoad] Getting minimal instructions for user: ${params.userId.substring(0, 8)}...`);
      // If we have a userId, add a slight enhancement to the base instructions
      return `${baseInstructions}\n\nYou are speaking with user ${params.userId.substring(0, 8)}... Additional context will be loaded shortly.`;
    } else {
      console.log(`[UnifiedContext] [Phase1] [ContextLoad] Getting minimal instructions for guest session (no userId)`);
      // Return the basic instructions with a note about guest session
      return `${baseInstructions}\n\nThis is a guest session with limited context.`;
    }
  } catch (error) {
    console.error("[UnifiedContext] [Phase1] [ContextLoad] [ERROR] Error getting minimal instructions:", error);
    console.error("[UnifiedContext] [Phase1] [ContextLoad] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    // Even on error, return something rather than failing
    return baseInstructions;
  }
}
