
import { supabase } from "@/integrations/supabase/client";
import { fetchMessagesWithMetadata } from "@/services/messages/messageStorage";
import { ContextData } from "./types";
import { formatChatContext, formatKnowledgeEntries } from "./formatters";
import { extractUserDetails, extractCriticalInformation } from "./extractors";
import { fetchAnalysisResults } from "./analysisService";

/**
 * Fetch user context data from Supabase
 */
export const fetchUserContext = async (userId?: string): Promise<ContextData | null> => {
  if (!userId) {
    console.log("No user ID provided for context enrichment");
    return null;
  }

  try {
    // Get current user session if no userId provided
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      userId = session?.user?.id;
      
      if (!userId) {
        console.log("No active user session found");
        return null;
      }
    }

    console.log(`Fetching context for user: ${userId}`);
    
    // Fetch messages with metadata
    const messages = await fetchMessagesWithMetadata();
    
    if (!messages) {
      console.log("No messages found for context enrichment");
      return {
        historySummary: "No previous conversation history found.",
        recentMessages: []
      };
    }
    
    // Extract custom instructions from the most recent messages
    const customInstructions = messages
      .filter(msg => msg.instructions)
      .map(msg => msg.instructions)
      .slice(-3)
      .join('\n');
    
    // Extract knowledge entries
    const knowledgeEntries = messages
      .filter(msg => msg.knowledge_entries && Array.isArray(msg.knowledge_entries))
      .flatMap(msg => msg.knowledge_entries || []);
    
    // Format the chat history
    const formattedHistory = formatChatContext(messages);
    
    // Extract user details for continuity
    const userDetails = extractUserDetails(messages);
    
    // Extract critical information
    const criticalInformation = extractCriticalInformation(messages);
    
    // Fetch analysis results
    const analysisResults = await fetchAnalysisResults(userId);
    
    // Create a summary
    const historySummary = messages.length > 0 
      ? `User has ${messages.length} previous messages in conversation history.` 
      : "This is a new conversation with no previous history.";
    
    return {
      historySummary,
      recentMessages: formattedHistory.split('\n\n'),
      userInstructions: customInstructions || undefined,
      knowledgeEntries: knowledgeEntries.length > 0 ? knowledgeEntries : undefined,
      userDetails: Object.keys(userDetails).length > 0 ? userDetails : undefined,
      criticalInformation: criticalInformation.length > 0 ? criticalInformation : undefined,
      analysisResults: analysisResults || undefined
    };
  } catch (error) {
    console.error("Error fetching user context:", error);
    return null;
  }
};
