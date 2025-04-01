
import { fetchUserContext } from "./contextService";
import { formatKnowledgeEntries } from "./formatters";

/**
 * Enhance the system prompt with user context
 */
export const enhanceInstructionsWithContext = async (
  baseInstructions: string, 
  userId?: string
): Promise<string> => {
  // Fetch user context
  const userContext = await fetchUserContext(userId);
  
  if (!userContext) {
    return baseInstructions;
  }
  
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
  
  return enrichedInstructions;
};
