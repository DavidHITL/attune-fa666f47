
/**
 * Context summary - handles quick retrieval of summarized context information
 * This provides fast access to context status without detailed loading
 */
import { fetchUserContext } from "./index";

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
