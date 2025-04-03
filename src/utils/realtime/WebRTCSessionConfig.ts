
import { WebRTCOptions } from "./WebRTCTypes";
import { getMinimalInstructions, getUnifiedEnhancedInstructions, updateSessionWithFullContext } from "@/services/context/unifiedContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { prepareContextData } from "@/services/response/contextPreparation";

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
 * Phase 1: Fast connection with minimal context
 */
export async function configureSession(dc: RTCDataChannel, options: WebRTCOptions): Promise<void> {
  console.log("[WebRTCSessionConfig] Phase 1: Configuring initial session");
  
  if (dc.readyState !== "open") {
    console.error(`[WebRTCSessionConfig] Cannot configure session: Data channel not open (state: ${dc.readyState})`);
    throw new Error(`Data channel not open (state: ${dc.readyState})`);
  }
  
  try {
    // Get base instructions from configuration
    const baseInstructions = await getBaseInstructions();
    
    // Get minimal instructions for fast initial connection
    // This is Phase 1 - lightweight context for quick connection
    const minimalInstructions = await getMinimalInstructions(
      baseInstructions,
      {
        userId: options.userId,
        activeMode: 'voice'
      }
    );
    
    console.log("[WebRTCSessionConfig] Sending initial session configuration with minimal context");
    
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
    
    // Send the initial configuration
    dc.send(JSON.stringify(initialSessionConfig));
    console.log("[WebRTCSessionConfig] Initial session configuration sent successfully");
    
    // Listen for data channel open event to trigger Phase 2
    // Set up event listener for full context update when data channel is confirmed working
    console.log("[WebRTCSessionConfig] Setting up Phase 2 context loading");
    
    // Wait a moment before loading the full context to ensure the connection is stable
    setTimeout(() => {
      loadFullContextPhase(dc, baseInstructions, options);
    }, 1000);
    
    // Success
    console.log("[WebRTCSessionConfig] Phase 1 configuration completed");
    return Promise.resolve();
  } catch (error) {
    console.error("[WebRTCSessionConfig] Error in Phase 1 session configuration:", error);
    return Promise.reject(error);
  }
}

/**
 * Phase 2: Full context loading once data channel is confirmed working
 */
async function loadFullContextPhase(
  dc: RTCDataChannel, 
  baseInstructions: string,
  options: WebRTCOptions
): Promise<void> {
  try {
    console.log("[WebRTCSessionConfig] Phase 2: Loading full context");
    
    if (dc.readyState !== 'open') {
      console.warn("[WebRTCSessionConfig] Phase 2 aborted: Data channel no longer open");
      return;
    }
    
    // Verify we have a userId before proceeding with context loading
    if (!options.userId) {
      console.log("[WebRTCSessionConfig] No userId available for Phase 2, skipping full context");
      return;
    }
    
    console.log(`[WebRTCSessionConfig] Phase 2: Loading full context for user: ${options.userId}`);
    
    // Update the session with full context
    const success = await updateSessionWithFullContext(
      dc,
      baseInstructions,
      {
        userId: options.userId,
        activeMode: 'voice',
        sessionStarted: true
      }
    );
    
    if (success) {
      console.log("[WebRTCSessionConfig] Phase 2 completed: Full context loaded and sent");
    } else {
      console.warn("[WebRTCSessionConfig] Phase 2 completed with warnings: Some context may not have been loaded");
    }
  } catch (error) {
    console.error("[WebRTCSessionConfig] Error in Phase 2 context loading:", error);
    // Don't throw here - this is a background task that shouldn't break the connection
  }
}
