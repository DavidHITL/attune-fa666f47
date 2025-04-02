
import { supabase } from "@/integrations/supabase/client";
import { fetchMessagesFromDatabase } from "@/services/messages/messageStorage";
import { ContextData } from "./types";
import { formatChatContext, formatKnowledgeEntries } from "./formatters";
import { extractUserDetails, extractCriticalInformation } from "./extractors";
import { fetchAnalysisResults } from "./analysisService";

/**
 * Fetch user context data from Supabase
 */
export const fetchUserContext = async (userId?: string): Promise<ContextData | null> => {
  console.log("[Context] Fetching context for user:", userId);
  
  if (!userId) {
    console.log("[Context] No user ID provided for context enrichment");
    return null;
  }

  try {
    console.log(`[Context] Fetching context for user: ${userId}`);
    
    // Fetch messages with metadata
    const messages = await fetchMessagesFromDatabase(userId);
    
    if (!messages || messages.length === 0) {
      console.log("[Context] No messages found for context enrichment");
      return {
        historySummary: "No previous conversation history found.",
        recentMessages: []
      };
    }
    
    console.log(`[Context] Found ${messages.length} messages for context enrichment`);
    
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
    
    // Fetch therapy concepts from database
    const { data: therapyConcepts } = await supabase
      .from('therapy_concepts')
      .select('*')
      .limit(10);
    
    // Fetch therapy sources from database
    const { data: therapySources } = await supabase
      .from('therapy_sources')
      .select('*')
      .limit(10);
      
    // Create a summary
    const historySummary = messages.length > 0 
      ? `User has ${messages.length} previous messages in conversation history.` 
      : "This is a new conversation with no previous history.";
    
    const contextData = {
      historySummary,
      recentMessages: formattedHistory.split('\n\n'),
      userInstructions: customInstructions || undefined,
      knowledgeEntries: [
        ...(knowledgeEntries.length > 0 ? knowledgeEntries : []),
        ...(therapyConcepts || []).map(concept => ({
          type: 'concept',
          name: concept.name,
          description: concept.description,
          category: concept.category
        })),
        ...(therapySources || []).map(source => ({
          type: 'source',
          title: source.title,
          author: source.author,
          year: source.year,
          description: source.description,
          content_summary: source.content_summary
        }))
      ],
      userDetails: Object.keys(userDetails).length > 0 ? userDetails : undefined,
      criticalInformation: criticalInformation.length > 0 ? criticalInformation : undefined,
      analysisResults: analysisResults || undefined
    };
    
    console.log("[Context] Context data prepared successfully:", {
      messageCount: messages.length,
      hasInstructions: !!contextData.userInstructions,
      knowledgeEntryCount: contextData.knowledgeEntries?.length || 0,
      therapyConcepts: therapyConcepts?.length || 0,
      therapySources: therapySources?.length || 0,
      userDetailsCount: contextData.userDetails ? Object.keys(contextData.userDetails).length : 0,
      criticalInfoCount: contextData.criticalInformation?.length || 0,
      hasAnalysisResults: !!contextData.analysisResults
    });
    
    return contextData;
  } catch (error) {
    console.error("[Context] Error fetching user context:", error);
    return null;
  }
};

/**
 * Internal function to fetch messages with metadata for a specific user
 * This is a local implementation specifically for the context service
 */
const fetchLocalMessagesWithMetadata = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
      
    if (error) {
      console.error("[Context] Error fetching messages:", error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("[Context] Error in fetchLocalMessagesWithMetadata:", error);
    return null;
  }
};
