
import { WebSocketManager } from './WebSocketManager';

/**
 * Manages realtime chat sessions
 */
export class SessionManager {
  /**
   * Configures the session with optimal settings
   */
  configureSession(webSocketManager: WebSocketManager): boolean {
    try {
      console.log("Configuring voice session with optimal settings");

      // Configure session with audio settings for optimal experience
      const sessionConfig = {
        type: "session.update",
        session: {
          modalities: ["text", "audio"],
          input_audio_format: "pcm16",
          output_audio_format: "pcm16",
          turn_detection: {
            type: "server_vad", // Use server-side voice activity detection
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.7,
          max_response_output_tokens: "inf"
        }
      };
      
      if (!webSocketManager) {
        console.error("WebSocketManager not available or not properly initialized");
        return false;
      }
      
      // Send configuration to the server
      return webSocketManager.send(sessionConfig);
    } catch (error) {
      console.error("Failed to configure session:", error);
      return false;
    }
  }
}
