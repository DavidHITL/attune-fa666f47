
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Configure the WebRTC session after connection is established
 */
export function configureSession(dc: RTCDataChannel, options: WebRTCOptions): void {
  console.log("[WebRTCSessionConfig] Configuring session");
  
  if (dc.readyState !== "open") {
    console.error(`[WebRTCSessionConfig] Cannot configure session: Data channel not open (state: ${dc.readyState})`);
    return;
  }
  
  try {
    // Send session configuration to OpenAI
    const sessionConfig = {
      event_id: `event_${Date.now()}`,
      type: "session.update",
      session: {
        modalities: ["text", "audio"],
        instructions: options.instructions || "You are a helpful assistant.",
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
        temperature: 0.7
      }
    };
    
    console.log("[WebRTCSessionConfig] Sending session configuration:", JSON.stringify(sessionConfig, null, 2));
    
    dc.send(JSON.stringify(sessionConfig));
    
    // Configure conversation if instructions provided
    if (options.instructions) {
      console.log("[WebRTCSessionConfig] Setting system instructions:", options.instructions);
      
      const systemMessage = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "system",
          content: [
            {
              type: "input_text",
              text: options.instructions
            }
          ]
        }
      };
      
      dc.send(JSON.stringify(systemMessage));
    }
    
    console.log("[WebRTCSessionConfig] Session configuration completed");
  } catch (error) {
    console.error("[WebRTCSessionConfig] Error configuring session:", error);
  }
}
