
import { fetchUserContext } from "@/services/context";
import { ApiContextData } from "./types";
import { supabase } from "@/integrations/supabase/client";
import { logContextVerification } from "@/services/context/unifiedContextProvider";

/**
 * Prepare context data for the API request
 */
export const prepareContextData = async (userId?: string): Promise<ApiContextData | null> => {
  // If no userId is provided, try to get it from the current session
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession();
    userId = session?.user?.id;
    
    if (!userId) {
      console.error("[contextPreparation] No valid userId available for context preparation");
      return null;
    }
  }
  
  console.log(`[contextPreparation] Preparing context data for user: ${userId}`);
  
  // Fetch context data for the AI using the userId
  const contextData = await fetchUserContext(userId);
  
  if (!contextData) {
    console.warn(`[contextPreparation] Failed to retrieve context data for user: ${userId}`);
    return null;
  }
  
  // Log context verification data
  await logContextVerification({
    userId,
    activeMode: 'text',
    sessionStarted: true,
    sessionProgress: 0
  }, undefined, {
    contextDataSize: JSON.stringify(contextData).length,
    messageCount: contextData.recentMessages.length,
    knowledgeEntries: contextData.knowledgeEntries?.length || 0,
    contextSource: "API context preparation"
  });
  
  // Log detailed context data being used (helpful for debugging)
  console.log("[contextPreparation] Context data prepared:", {
    historyLength: contextData.recentMessages.length,
    hasInstructions: !!contextData.userInstructions,
    knowledgeEntries: contextData.knowledgeEntries?.length || 0,
    userDetails: contextData.userDetails ? Object.keys(contextData.userDetails).length : 0,
    criticalInformation: contextData.criticalInformation?.length || 0,
    hasAnalysisResults: !!contextData.analysisResults
  });
  
  // Convert to API format
  return {
    recentMessages: contextData.recentMessages,
    therapyConcepts: contextData.knowledgeEntries?.filter(k => k.type === 'concept'),
    therapySources: contextData.knowledgeEntries?.filter(k => k.type === 'source'),
    userDetails: contextData.userDetails,
    criticalInformation: contextData.criticalInformation,
    analysisResults: contextData.analysisResults
  };
};
