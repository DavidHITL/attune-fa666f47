
import { Message } from "@/components/MessageBubble";
import { fetchUserContext, enhanceInstructionsWithContext } from "@/services/context";
import { saveMessage } from "@/services/messages/messageStorage";
import { supabase } from "@/integrations/supabase/client";

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
    console.log("[UnifiedContext] Context verification metrics:", {
      mode: options.activeMode,
      messageCount: contextData.recentMessages.length,
      hasUserDetails: !!contextData.userDetails && Object.keys(contextData.userDetails).length > 0,
      hasCriticalInfo: !!contextData.criticalInformation && contextData.criticalInformation.length > 0,
      hasAnalysis: !!contextData.analysisResults,
      knowledgeEntryCount: contextData.knowledgeEntries?.length || 0,
      instructionsLength: instructions ? instructions.length : 0,
      sessionProgress: options.sessionProgress || 0,
      ...additionalContext
    });
    
    // For detailed debugging, log to database
    const { error } = await supabase
      .from('context_verification_logs')
      .insert({
        user_id: options.userId,
        mode: options.activeMode,
        message_count: contextData.recentMessages.length,
        has_user_details: !!contextData.userDetails && Object.keys(contextData.userDetails).length > 0,
        has_critical_info: !!contextData.criticalInformation && contextData.criticalInformation.length > 0, 
        has_analysis: !!contextData.analysisResults,
        knowledge_entry_count: contextData.knowledgeEntries?.length || 0,
        instructions_provided: !!instructions,
        additional_context: additionalContext || {}
      })
      .maybeSingle();
    
    if (error) {
      // Non-critical error, log but continue
      console.warn("[UnifiedContext] Error logging verification data:", error);
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
