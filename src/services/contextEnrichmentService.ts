
import { supabase } from "@/integrations/supabase/client";
import { fetchMessagesWithMetadata } from "@/services/messages/messageStorage";

/**
 * Interface for context enrichment data
 */
export interface ContextData {
  historySummary: string;
  recentMessages: string[];
  userInstructions?: string;
  knowledgeEntries?: any[];
}

/**
 * Maximum number of messages to include in context
 */
const MAX_MESSAGE_COUNT = 15;

/**
 * Format chat history for the AI context window
 */
export const formatChatContext = (messages: any[]): string => {
  if (!messages || messages.length === 0) {
    return "";
  }
  
  // Extract only the most recent messages
  const recentMessages = messages.slice(-MAX_MESSAGE_COUNT);
  
  return recentMessages.map(msg => {
    const role = msg.sender_type === 'user' ? 'User' : 'AI';
    const timestamp = new Date(msg.created_at).toLocaleString();
    return `[${timestamp}] ${role}: ${msg.content}`;
  }).join('\n\n');
};

/**
 * Format knowledge entries for the AI context window
 */
export const formatKnowledgeEntries = (entries: any[]): string => {
  if (!entries || entries.length === 0) {
    return "";
  }
  
  return `RELEVANT KNOWLEDGE:\n${entries.map((entry, index) => 
    `[${index + 1}] ${entry.title || 'Untitled'}: ${entry.content || entry.description || 'No content'}`
  ).join('\n\n')}`;
};

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
    
    // Create a summary
    const historySummary = messages.length > 0 
      ? `User has ${messages.length} previous messages in conversation history.` 
      : "This is a new conversation with no previous history.";
    
    return {
      historySummary,
      recentMessages: formattedHistory.split('\n\n'),
      userInstructions: customInstructions || undefined,
      knowledgeEntries: knowledgeEntries.length > 0 ? knowledgeEntries : undefined
    };
  } catch (error) {
    console.error("Error fetching user context:", error);
    return null;
  }
};

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
