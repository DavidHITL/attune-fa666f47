
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
      .single();
    
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
    return;
  }
  
  try {
    // Get base instructions from configuration
    const baseInstructions = await getBaseInstructions();
    
    // Enhance instructions with therapy context, using unified context provider
    const enhancedInstructions = await getUnifiedEnhancedInstructions(
      options.instructions || baseInstructions,
      {
        userId: options.userId,
        activeMode: 'voice'
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
        // Use 'opus' as input format since we're using the direct WebRTC track
        // which typically uses Opus codec
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
          "Remember important personal details like names and relationship history",
          "Apply insights from previous pattern analysis to current interaction",
          "Maintain continuity between text and voice conversations",
          "Prioritize remembering personal names and relationship details",
          "Provide continuous therapeutic support without forgetting previously discussed topics"
        ]
      }
    };
    
    console.log("[WebRTCSessionConfig] Sending session configuration with enhanced context");
    dc.send(JSON.stringify(sessionConfig));
    
    console.log("[WebRTCSessionConfig] Session configuration completed");
  } catch (error) {
    console.error("[WebRTCSessionConfig] Error configuring session:", error);
  }
}
