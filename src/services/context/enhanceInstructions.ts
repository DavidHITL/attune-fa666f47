
import { fetchUserContext } from "./index";
import { ContextData } from "./types";

/**
 * Enhance the base instructions with user context
 * This is used for the Phase 2 context enrichment
 */
export async function enhanceInstructionsWithContext(
  baseInstructions: string,
  userId: string
): Promise<string> {
  try {
    console.log(`[enhanceInstructions] Loading context data for user ${userId}`);
    
    // Fetch user context with a timeout to prevent hanging
    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 3000);
    });
    
    const contextDataPromise = fetchUserContext(userId);
    const contextData = await Promise.race([contextDataPromise, timeoutPromise]) as ContextData | null;
    
    if (!contextData) {
      console.warn("[enhanceInstructions] Context loading timed out or failed");
      return baseInstructions;
    }
    
    console.log(`[enhanceInstructions] Successfully loaded context for user ${userId}`);
    
    // Start building enhanced instructions
    let enhancedInstructions = baseInstructions + "\n\n";
    
    // Add session continuity indicator
    enhancedInstructions += "IMPORTANT: This is a continuation of previous sessions with this user.\n\n";
    
    // Add user details if available
    if (contextData.userDetails && Object.keys(contextData.userDetails).length > 0) {
      enhancedInstructions += "## User Details\n";
      Object.entries(contextData.userDetails).forEach(([key, value]) => {
        enhancedInstructions += `- ${key}: ${value}\n`;
      });
      enhancedInstructions += "\n";
    }
    
    // Add critical information if available
    if (contextData.criticalInformation && contextData.criticalInformation.length > 0) {
      enhancedInstructions += "## Critical Information\n";
      contextData.criticalInformation.forEach(info => {
        enhancedInstructions += `- ${info}\n`;
      });
      enhancedInstructions += "\n";
    }
    
    // Add user instructions if available
    if (contextData.userInstructions) {
      enhancedInstructions += "## User Preferences\n";
      enhancedInstructions += contextData.userInstructions + "\n\n";
    }
    
    // Add recent conversation history summary
    if (contextData.recentMessages && contextData.recentMessages.length > 0) {
      enhancedInstructions += "## Recent Conversation History\n";
      
      // Only include up to 5 most recent interactions to avoid token limits
      const recentMessages = contextData.recentMessages.slice(0, 5);
      recentMessages.forEach(msg => {
        enhancedInstructions += msg + "\n";
      });
      
      if (contextData.recentMessages.length > 5) {
        enhancedInstructions += `... (${contextData.recentMessages.length - 5} earlier messages not shown)\n`;
      }
      
      enhancedInstructions += "\n";
    }
    
    // Add analysis results if available
    if (contextData.analysisResults) {
      enhancedInstructions += "## Analysis Insights\n";
      enhancedInstructions += `${contextData.analysisResults}\n\n`;
    }
    
    // Add reminder at the end
    enhancedInstructions += "Remember to maintain context continuity across both text and voice interactions with this user.\n";
    
    console.log(`[enhanceInstructions] Enhanced instructions created with ${
      (contextData.recentMessages?.length || 0)} messages, ${
      contextData.userDetails ? Object.keys(contextData.userDetails).length : 0} user details, ${
      contextData.analysisResults ? "with" : "without"} analysis results`
    );
    
    return enhancedInstructions;
  } catch (error) {
    console.error("[enhanceInstructions] Error enhancing instructions:", error);
    // Return original instructions if enhancement fails
    return baseInstructions;
  }
}
