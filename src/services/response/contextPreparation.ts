
import { ContextData, fetchUserContext } from "@/services/context";
import { ApiContextData } from "./types";

/**
 * Prepare context data for the API request
 */
export const prepareContextData = async (): Promise<ApiContextData | null> => {
  // Fetch context data for the AI
  const contextData = await fetchUserContext();
  
  if (!contextData) {
    return null;
  }
  
  // Log context data being used (helpful for debugging)
  console.log("Context data prepared:", {
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
