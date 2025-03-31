
import { WebRTCOptions } from "./WebRTCTypes";
import { enhanceInstructionsWithContext } from "@/services/contextEnrichmentService";
import { supabase } from "@/integrations/supabase/client";

/**
 * Configure the session with OpenAI after connection is established
 */
export async function configureSession(
  dc: RTCDataChannel,
  options: WebRTCOptions
): Promise<void> {
  if (dc.readyState !== "open") {
    console.warn("[WebRTC] Data channel not ready, cannot configure session");
    return;
  }

  try {
    // Get the current user ID for context enrichment
    let userId: string | undefined = undefined;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      userId = session.user.id;
    }
    
    // Enhance instructions with context from previous conversations
    let enrichedInstructions = options.instructions || "";
    
    if (userId) {
      console.log("[WebRTC] Enriching instructions with user context");
      enrichedInstructions = await enhanceInstructionsWithContext(
        options.instructions || "",
        userId
      );
      console.log("[WebRTC] Context enrichment complete");
    }

    // Send session configuration to OpenAI
    const sessionConfig = {
      event_id: `event_${Date.now()}`,
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: enrichedInstructions,
        voice: options.voice,
        input_audio_format: "pcm16",
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
        temperature: 0.7,
        max_response_output_tokens: "inf"
      }
    };

    console.log("[WebRTC] Configuring session with enriched context");
    dc.send(JSON.stringify(sessionConfig));
  } catch (error) {
    console.error("[WebRTC] Error configuring session:", error);
  }
}
