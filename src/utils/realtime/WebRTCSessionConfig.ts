
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Configure the session with OpenAI after connection is established
 */
export function configureSession(
  dc: RTCDataChannel,
  options: WebRTCOptions
): void {
  if (dc.readyState !== "open") {
    console.warn("[WebRTC] Data channel not ready, cannot configure session");
    return;
  }

  try {
    // Send session configuration to OpenAI
    const sessionConfig = {
      event_id: `event_${Date.now()}`,
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: options.instructions,
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

    console.log("[WebRTC] Configuring session:", sessionConfig);
    dc.send(JSON.stringify(sessionConfig));
  } catch (error) {
    console.error("[WebRTC] Error configuring session:", error);
  }
}
