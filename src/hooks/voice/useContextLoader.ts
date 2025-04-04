
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { doesAnalysisExist } from "@/services/context/analysisService";
import { fetchUserContext } from "@/services/context";
import { getRecentContextSummary } from "@/services/context/unifiedContextProvider";

/**
 * Hook to handle loading user context with appropriate timeout handling
 */
export function useContextLoader(userId?: string) {
  const [contextLoaded, setContextLoaded] = useState(false);
  const [contextLoadError, setContextLoadError] = useState<string | null>(null);

  /**
   * Load context with a timeout to prevent blocking connections
   */
  const loadContextWithTimeout = useCallback(async () => {
    if (!userId) {
      console.log("[VoiceChat] No user ID available, proceeding as guest");
      setContextLoaded(true);
      return;
    }
    
    try {
      // Create a timeout promise to ensure we don't block forever
      const timeoutPromise = new Promise<void>((resolve) => {
        setTimeout(() => {
          console.warn("[VoiceChat] Context loading timed out, proceeding anyway");
          setContextLoadError("Context loading timed out");
          resolve();
        }, 5000); // 5 second timeout
      });
      
      // Create the actual context loading promise
      const loadPromise = async () => {
        try {
          console.log(`[VoiceChat] Preloading user context with userId: ${userId}`);
          
          // Get context summary first (fast operation)
          const contextSummary = await getRecentContextSummary(userId);
          if (contextSummary) {
            console.log("[VoiceChat] Context summary:", contextSummary);
          }
          
          // Check if user has analysis results (fast operation)
          const hasAnalysis = await doesAnalysisExist(userId);
          console.log("[VoiceChat] User has analysis results:", hasAnalysis);
          
          // Load full context (potentially slower)
          const userContext = await fetchUserContext(userId);
          if (userContext) {
            console.log("[VoiceChat] User context loaded successfully:", {
              messageCount: userContext.recentMessages?.length || 0,
              hasUserDetails: !!userContext.userDetails,
              analysisPresent: !!userContext.analysisResults,
              knowledgeEntries: userContext.knowledgeEntries?.length || 0
            });
            
            // Show toast if we have previous context
            if (userContext.recentMessages && userContext.recentMessages.length > 0) {
              toast.success(`Loaded context from ${userContext.recentMessages.length} previous messages`);
            }
          } else {
            console.log("[VoiceChat] No user context available");
            setContextLoadError("No context available for user");
          }
        } catch (error) {
          console.error("[VoiceChat] Error loading context:", error);
          setContextLoadError(error instanceof Error ? error.message : "Unknown error loading context");
          throw error;
        }
      };
      
      // Race between timeout and loading
      await Promise.race([loadPromise(), timeoutPromise]);
      
      // Mark context as loaded regardless of outcome
      // This ensures we can proceed even with partial or no context
      setContextLoaded(true);
    } catch (error) {
      // Final fallback - proceed even if everything fails
      console.error("[VoiceChat] Critical error in context loading:", error);
      setContextLoaded(true); 
      setContextLoadError("Failed to load user context");
    }
  }, [userId]);

  return {
    contextLoaded,
    contextLoadError,
    setContextLoaded,
    setContextLoadError,
    loadContextWithTimeout
  };
}
