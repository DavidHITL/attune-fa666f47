
import { fetchUserContext } from "./contextService";
import { formatKnowledgeEntries } from "./formatters";
import { supabase } from "@/integrations/supabase/client";

/**
 * Enhance the system prompt with user context
 */
export const enhanceInstructionsWithContext = async (
  baseInstructions: string, 
  userId?: string
): Promise<string> => {
  console.log("[Context] Enhancing instructions with context for userId:", userId);
  
  // Fetch user context
  const userContext = await fetchUserContext(userId);
  
  if (!userContext) {
    console.warn("[Context] No user context available for enhancement");
    return baseInstructions;
  }
  
  console.log("[Context] User context loaded:", {
    hasMessages: userContext.recentMessages?.length > 0,
    hasAnalysis: !!userContext.analysisResults,
    hasUserDetails: !!userContext.userDetails,
    hasCriticalInfo: userContext.criticalInformation?.length > 0,
    hasUserInstructions: !!userContext.userInstructions,
    hasKnowledgeEntries: userContext.knowledgeEntries?.length > 0
  });
  
  // Build enriched instructions
  let enrichedInstructions = baseInstructions;
  
  // Add critical user details first for highest priority
  if (userContext.userDetails) {
    const detailsText = Object.entries(userContext.userDetails)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    enrichedInstructions += `\n\nIMPORTANT USER DETAILS (always remember these):\n${detailsText}`;
  }
  
  // Add critical information that should be remembered across sessions
  if (userContext.criticalInformation?.length) {
    enrichedInstructions += `\n\nCRITICAL THERAPEUTIC INSIGHTS (maintain awareness of these):\n${userContext.criticalInformation.join('\n')}`;
  }
  
  // Add analysis results if available
  if (userContext.analysisResults) {
    enrichedInstructions += "\n\nUSER ANALYSIS RESULTS:";
    
    if (userContext.analysisResults.summary) {
      enrichedInstructions += `\nSummary: ${userContext.analysisResults.summary}`;
    }
    
    if (userContext.analysisResults.keywords && userContext.analysisResults.keywords.length > 0) {
      enrichedInstructions += `\nKey Themes: ${userContext.analysisResults.keywords.join(', ')}`;
    }
    
    if (userContext.analysisResults.losingStrategies) {
      const strategies = userContext.analysisResults.losingStrategies;
      enrichedInstructions += "\nLosing Strategies Analysis:";
      if ('beingRight' in strategies) enrichedInstructions += `\n- Being Right: ${strategies.beingRight}/5`;
      if ('controlling' in strategies) enrichedInstructions += `\n- Controlling: ${strategies.controlling}/5`;
      if ('unbridledSelfExpression' in strategies) enrichedInstructions += `\n- Unbridled Self-Expression: ${strategies.unbridledSelfExpression}/5`;
      if ('retaliation' in strategies) enrichedInstructions += `\n- Retaliation: ${strategies.retaliation}/5`;
      if ('withdrawal' in strategies) enrichedInstructions += `\n- Withdrawal: ${strategies.withdrawal}/5`;
    }
  }
  
  // Add user instructions if available
  if (userContext.userInstructions) {
    enrichedInstructions += `\n\nUser's Custom Instructions:\n${userContext.userInstructions}`;
  }
  
  // Add knowledge entries if available
  if (userContext.knowledgeEntries && userContext.knowledgeEntries.length > 0) {
    enrichedInstructions += `\n\n${formatKnowledgeEntries(userContext.knowledgeEntries)}`;
  }
  
  // Add conversation history summary
  if (userContext.recentMessages.length > 0) {
    enrichedInstructions += `\n\nRECENT CONVERSATION HISTORY:\n${userContext.recentMessages.join('\n\n')}`;
  }
  
  console.log("[Context] Instructions enhanced successfully. Added context categories:", {
    userDetails: !!userContext.userDetails,
    criticalInfo: userContext.criticalInformation?.length > 0,
    analysisResults: !!userContext.analysisResults,
    userInstructions: !!userContext.userInstructions,
    knowledgeEntries: userContext.knowledgeEntries?.length > 0,
    recentMessages: userContext.recentMessages.length > 0
  });
  
  return enrichedInstructions;
};
