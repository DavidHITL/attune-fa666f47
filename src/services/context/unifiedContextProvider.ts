
import { Message } from "@/components/MessageBubble";
import { fetchUserContext, enhanceInstructionsWithContext } from "@/services/context";
import { saveMessage } from "@/services/messages/messageStorage";
import { supabase } from "@/integrations/supabase/client";
import { logToConsoleIfDbFails } from "./contextVerificationService";

/**
 * Unified Context Provider 
 * Manages context across both text and voice interfaces
 */
export interface UnifiedContextOptions {
  userId?: string;
  sessionStarted?: boolean;
  sessionProgress?: number;
  activeMode: 'text' | 'voice';
}

/**
 * Get enhanced instructions that work for both text and voice interfaces
 */
export const getUnifiedEnhancedInstructions = async (baseInstructions: string, options: UnifiedContextOptions): Promise<string> => {
  console.log(`[UnifiedContext] Getting enhanced instructions for ${options.activeMode} mode`);

  // Add transition flag to indicate context continuity
  const enhancedInstructions = await enhanceInstructionsWithContext(
    baseInstructions,
    options.userId
  );
  
  // Add specific instructions for maintaining context across modes
  const modeTransitionInstructions = 
    `\n\nIMPORTANT CONTEXT CONTINUITY INSTRUCTIONS:
     - You are running in ${options.activeMode.toUpperCase()} mode.
     - Maintain complete memory and context continuity between text and voice conversations.
     - Reference relevant details from previous interactions regardless of whether they occurred in text or voice mode.
     - Ensure consistency in personality, knowledge access, and context awareness across both interfaces.`;

  return enhancedInstructions + modeTransitionInstructions;
}

/**
 * Track a transition between modes to ensure context continuity
 */
export const trackModeTransition = async (
  fromMode: 'text' | 'voice',
  toMode: 'text' | 'voice',
  userId?: string,
  lastMessage?: string
): Promise<void> => {
  if (!userId) {
    console.log("[UnifiedContext] No user ID provided for tracking mode transition");
    return;
  }

  console.log(`[UnifiedContext] Tracking transition from ${fromMode} to ${toMode} mode`);
  
  try {
    // Create a system message to mark the transition
    const transitionMessage = `[System: User transitioned from ${fromMode} to ${toMode} interface. Maintaining context continuity...]`;
    
    // Save as system message for context but don't display to user
    await saveMessage(transitionMessage, false, {
      messageType: 'system',
      instructions: `Maintain context continuity. Previous mode: ${fromMode}, new mode: ${toMode}`,
      knowledgeEntries: [{
        type: 'mode_transition',
        fromMode,
        toMode,
        timestamp: new Date().toISOString(),
        lastMessage
      }]
    });
    
    console.log("[UnifiedContext] Successfully tracked mode transition");
  } catch (error) {
    console.error("[UnifiedContext] Error tracking mode transition:", error);
  }
};

/**
 * Log context information for verification purposes
 */
export const logContextVerification = async (
  options: UnifiedContextOptions,
  instructions?: string,
  additionalContext?: Record<string, any>
): Promise<void> => {
  console.log("[UnifiedContext] Verifying context integrity");
  
  if (!options.userId) {
    console.log("[UnifiedContext] No user ID, skipping context verification");
    return;
  }
  
  try {
    // Get current context data
    const contextData = await fetchUserContext(options.userId);
    
    if (!contextData) {
      console.log("[UnifiedContext] No context data available for verification");
      return;
    }
    
    // Log key metrics for verification
    const verificationData = {
      user_id: options.userId,
      mode: options.activeMode,
      message_count: contextData.recentMessages.length,
      has_user_details: !!contextData.userDetails && Object.keys(contextData.userDetails).length > 0,
      has_critical_info: !!contextData.criticalInformation && contextData.criticalInformation.length > 0,
      has_analysis: !!contextData.analysisResults,
      knowledge_entry_count: contextData.knowledgeEntries?.length || 0,
      instructions_provided: !!instructions,
      additional_context: additionalContext || {}
    };
    
    console.log("[UnifiedContext] Context verification metrics:", verificationData);
    
    // Use direct API call to avoid TypeScript issues
    try {
      // Get the API endpoint and key from the supabase config
      const supabaseUrl = process.env.SUPABASE_URL || 'https://oseowhythgbqvllwonaz.supabase.co';
      const apiKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zZW93aHl0aGdicXZsbHdvbmF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE2MTgyNzgsImV4cCI6MjA1NzE5NDI3OH0.MubP80cszCAeIeyve_uY9zLZosck9010uhvbxBC57vo';
      
      const response = await fetch(`${supabaseUrl}/rest/v1/context_verification_logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apiKey,
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(verificationData)
      });
      
      if (!response.ok) {
        throw new Error(`Error logging to context_verification_logs: ${response.statusText}`);
      }
    } catch (dbError) {
      // Log the error but continue execution
      console.warn("[UnifiedContext] Error logging verification data:", dbError);
      logToConsoleIfDbFails(verificationData, dbError instanceof Error ? dbError : new Error(String(dbError)));
    }
  } catch (err) {
    console.error("[UnifiedContext] Error during context verification:", err);
  }
};

/**
 * Get a summary of the most recent context from either mode
 */
export const getRecentContextSummary = async (userId?: string): Promise<string | null> => {
  if (!userId) {
    return null;
  }
  
  try {
    // Get recent messages from both voice and text interactions
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error || !messages || messages.length === 0) {
      return null;
    }
    
    // Create a simple summary of recent interactions
    const textCount = messages.filter(m => m.message_type === 'text').length;
    const voiceCount = messages.filter(m => m.message_type === 'voice').length;
    
    // Get the most recent message
    const mostRecent = messages[0];
    const recentMode = mostRecent.message_type === 'voice' ? 'voice' : 'text';
    const recentContent = mostRecent.content?.substring(0, 100) + (mostRecent.content?.length > 100 ? '...' : '');
    
    return `Recent context includes ${messages.length} messages (${textCount} text, ${voiceCount} voice). ` +
           `Most recent interaction was in ${recentMode} mode: "${recentContent}"`;
  } catch (err) {
    console.error("[UnifiedContext] Error getting recent context summary:", err);
    return null;
  }
};
