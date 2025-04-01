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
  userDetails?: Record<string, string>; // For consistent personal details like names
  criticalInformation?: string[]; // For important therapeutic insights that must be retained
  analysisResults?: {
    summary?: string;
    keywords?: string[];
    losingStrategies?: {
      beingRight: number;
      unbridledSelfExpression: number;
      controlling: number;
      retaliation: number;
      withdrawal: number;
    };
  }; // New field for analysis results
}

/**
 * Maximum number of messages to include in context
 * Increased from 25 to 100 for better continuity
 */
const MAX_MESSAGE_COUNT = 100;

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
 * Extract key user information from conversation history
 * This helps maintain awareness of important user details across sessions
 */
const extractUserDetails = (messages: any[]): Record<string, string> => {
  const userDetails: Record<string, string> = {};
  const namePattern = /my name is ([A-Za-z]+)|I'm ([A-Za-z]+)|I am ([A-Za-z]+)|call me ([A-Za-z]+)/i;
  const partnerPattern = /my partner('s| is) ([A-Za-z]+)|partner named ([A-Za-z]+)/i;

  for (const msg of messages) {
    if (msg.sender_type !== 'user') continue;
    
    // Extract user's name
    const nameMatch = msg.content.match(namePattern);
    if (nameMatch) {
      const name = nameMatch[1] || nameMatch[2] || nameMatch[3] || nameMatch[4];
      if (name && name.length > 1) userDetails.userName = name;
    }
    
    // Extract partner's name
    const partnerMatch = msg.content.match(partnerPattern);
    if (partnerMatch) {
      const partnerName = partnerMatch[2] || partnerMatch[3];
      if (partnerName && partnerName.length > 1) userDetails.partnerName = partnerName;
    }
    
    // Could add more patterns for other critical information
  }
  
  return userDetails;
};

/**
 * Identify critical information from therapist insights
 * This helps ensure therapeutic insights are preserved
 */
const extractCriticalInformation = (messages: any[]): string[] => {
  const criticalInfo: string[] = [];
  
  for (const msg of messages) {
    if (msg.sender_type === 'bot' && msg.knowledge_entries?.length > 0) {
      // Extract insights from AI responses that referenced knowledge entries
      criticalInfo.push(`Therapist insight: ${msg.content.slice(0, 120)}...`);
    }
  }
  
  return criticalInfo.slice(-5); // Keep the 5 most recent critical insights
};

/**
 * Fetch user's analysis results from database
 */
const fetchAnalysisResults = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('summary_text, keywords, losing_strategy_flags')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.log("No analysis results found or error:", error);
      return null;
    }
    
    return {
      summary: data.summary_text,
      keywords: data.keywords,
      losingStrategies: data.losing_strategy_flags
    };
  } catch (err) {
    console.error("Error fetching analysis results:", err);
    return null;
  }
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
