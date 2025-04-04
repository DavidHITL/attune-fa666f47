
import { WebRTCOptions } from "./WebRTCTypes";
import { getMinimalInstructions } from "@/services/context/initialContextLoader";
import { getUnifiedEnhancedInstructions } from "@/services/context/enhancedContextLoader";
import { updateSessionWithFullContext } from "@/services/context/sessionContextUpdater";
import { supabase } from "@/integrations/supabase/client";
import { prepareContextData } from "@/services/response/contextPreparation";

/**
 * Get base instructions from AI configuration table
 */
async function getBaseInstructions(): Promise<string> {
  try {
    console.log("[WebRTCSessionConfig] Loading AI configuration from database");
    
    // Fetch base system prompt from AI configuration table
    const { data, error } = await supabase
      .from('ai_configuration')
      .select('value')
      .eq('id', 'system_prompt')
      .maybeSingle();
    
    if (error || !data) {
      console.warn("[WebRTCSessionConfig] [ConfigLoadError] Could not load AI configuration:", error);
      return "You are a helpful assistant. Be conversational yet concise in your responses.";
    }
    
    console.log("[WebRTCSessionConfig] Loaded AI configuration from database");
    return data.value;
  } catch (err) {
    console.error("[WebRTCSessionConfig] [ConfigLoadError] Error fetching AI configuration:", err);
    return "You are a helpful assistant. Be conversational yet concise in your responses.";
  }
}

/**
 * Configure the WebRTC session after connection is established
 * Phase 1: Fast connection with minimal context
 */
export async function configureSession(dc: RTCDataChannel, options: WebRTCOptions): Promise<void> {
  console.log("[WebRTCSessionConfig] Phase 1: Configuring initial session");
  
  // Validate data channel state
  if (dc.readyState !== "open") {
    console.error(`[WebRTCSessionConfig] [DataChannelError] Cannot configure session: Data channel not open (state: ${dc.readyState})`);
    throw new Error(`Data channel not open (state: ${dc.readyState})`);
  }
  
  try {
    // Get base instructions from configuration
    console.log("[WebRTCSessionConfig] Phase 1: Fetching base instructions");
    const baseInstructions = await getBaseInstructions();
    
    // Log if we have a userId for context
    if (options.userId) {
      console.log(`[WebRTCSessionConfig] Phase 1: Using userId ${options.userId} for context enrichment`);
    } else {
      console.log("[WebRTCSessionConfig] Phase 1: No userId available, using basic context");
    }
    
    // Get minimal instructions for fast initial connection
    // This is Phase 1 - lightweight context for quick connection
    console.log("[WebRTCSessionConfig] Phase 1: Getting minimal instructions");
    const minimalInstructions = await getMinimalInstructions(
      baseInstructions,
      {
        userId: options.userId,
        activeMode: 'voice'
      }
    );
    
    console.log("[WebRTCSessionConfig] Phase 1: Sending initial session configuration with minimal context");
    
    // Double-check the data channel is still open before sending
    if (dc.readyState !== "open") {
      console.error(`[WebRTCSessionConfig] [DataChannelError] Data channel closed while preparing session config (state: ${dc.readyState})`);
      throw new Error(`Data channel closed while preparing session config (state: ${dc.readyState})`);
    }
    
    // Send session configuration with minimal context to OpenAI
    const initialSessionConfig = {
      event_id: `event_initial_${Date.now()}`,
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: minimalInstructions,
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
        temperature: 0.75,
        priority_hints: [
          "Maintain consistent awareness of user details across the conversation",
          "Remember previous messages regardless of text or voice interface used"
        ]
      }
    };
    
    try {
      // Set up error handler for data channel
      const errorHandler = (event: Event) => {
        console.error("[WebRTCSessionConfig] [DataChannelError] Error during session configuration:", event);
        dc.removeEventListener('error', errorHandler);
      };
      dc.addEventListener('error', errorHandler);
      
      // Send initial configuration
      const messageJson = JSON.stringify(initialSessionConfig);
      console.log(`[WebRTCSessionConfig] Sending session update (${messageJson.length} bytes)`);
      
      // Final check of channel state before sending
      if (dc.readyState === "open") {
        dc.send(messageJson);
        console.log("[WebRTCSessionConfig] Phase 1: Initial session configuration sent successfully");
      } else {
        console.error(`[WebRTCSessionConfig] [DataChannelError] Data channel state changed to ${dc.readyState} during send`);
        throw new Error(`Data channel state changed to ${dc.readyState} during send`);
      }
      
      // Remove error handler after successful send
      dc.removeEventListener('error', errorHandler);
    } catch (error) {
      console.error("[WebRTCSessionConfig] [DataChannelError] Phase 1: Error sending initial configuration:", error);
      throw error;
    }
    
    console.log("[WebRTCSessionConfig] Phase 1: Configuration completed");
    return Promise.resolve();
  } catch (error) {
    console.error("[WebRTCSessionConfig] [ConfigurationError] Phase 1: Error in session configuration:", error);
    return Promise.reject(error);
  }
}
