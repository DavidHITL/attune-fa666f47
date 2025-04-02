
import { WebRTCOptions } from "./WebRTCTypes";
import { getUnifiedEnhancedInstructions } from "@/services/context/unifiedContextProvider";
import { supabase } from "@/integrations/supabase/client";

/**
 * Get base instructions from AI configuration table
 */
async function getBaseInstructions(): Promise<string> {
  try {
    // Fetch base system prompt from AI configuration table
    const { data, error } = await supabase
      .from('ai_configuration')
      .select('value')
      .eq('id', 'system_prompt')
      .maybeSingle();
    
    if (error || !data) {
      console.warn("[WebRTCSessionConfig] Could not load AI configuration:", error);
      return "You are a helpful assistant. Be conversational yet concise in your responses.";
    }
    
    console.log("[WebRTCSessionConfig] Loaded AI configuration from database");
    return data.value;
  } catch (err) {
    console.error("[WebRTCSessionConfig] Error fetching AI configuration:", err);
    return "You are a helpful assistant. Be conversational yet concise in your responses.";
  }
}

/**
 * Configure the WebRTC session after connection is established
 */
export async function configureSession(dc: RTCDataChannel, options: WebRTCOptions): Promise<void> {
  console.log("[WebRTCSessionConfig] Configuring session");
  
  if (dc.readyState !== "open") {
    console.error(`[WebRTCSessionConfig] Cannot configure session: Data channel not open (state: ${dc.readyState})`);
    throw new Error(`Data channel not open (state: ${dc.readyState})`);
  }
  
  try {
    // Get base instructions from configuration
    const baseInstructions = await getBaseInstructions();
    
    // Enhance instructions with context, using unified context provider
    console.log(`[WebRTCSessionConfig] Enhancing instructions with userId: ${options.userId || 'none'}`);
    
    // Check if we have a userId before trying to get enhanced instructions
    if (!options.userId) {
      console.warn("[WebRTCSessionConfig] No userId provided, using base instructions only");
    }
    
    const enhancedInstructions = await getUnifiedEnhancedInstructions(
      options.instructions || baseInstructions,
      {
        userId: options.userId,
        activeMode: 'voice',
        sessionStarted: true
      }
    );

    console.log("[WebRTCSessionConfig] Using enhanced instructions with unified context");
    
    // Send session configuration to OpenAI
    const sessionConfig = {
      event_id: `event_${Date.now()}`,
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: enhancedInstructions, // Using the enhanced instructions with unified context
        voice: options.voice || "alloy",
        input_audio_format: "opus", 
        output_audio_format: "pcm16", 
        input_audio_transcription: {
          model: "whisper-1"
        },
        turn_detection: {
          type: "server_vad",
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 1000
        },
        // Increase temperature slightly to ensure personality consistency
        temperature: 0.75,
        // Add priority directive for context maintenance
        priority_hints: [
          "Maintain consistent awareness of user details across the conversation",
          "Remember previous messages regardless of text or voice interface used",
          "Maintain context continuity between text and voice conversations with the same user",
          "Apply insights from previous pattern analysis to current interaction",
          "Prioritize remembering personal names and details mentioned in previous conversations",
          "Always keep track of conversation history and reference it when relevant"
        ]
      }
    };
    
    console.log("[WebRTCSessionConfig] Sending session configuration with enhanced context");
    
    // Send the configuration
    dc.send(JSON.stringify(sessionConfig));
    console.log("[WebRTCSessionConfig] Session configuration sent successfully");
    
    // Success
    console.log("[WebRTCSessionConfig] Session configuration completed");
    return Promise.resolve();
  } catch (error) {
    console.error("[WebRTCSessionConfig] Error configuring session:", error);
    return Promise.reject(error);
  }
}
