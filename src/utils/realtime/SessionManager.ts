
import { WebSocketManager } from './WebSocketManager';
import { SessionConfig } from './types';

/**
 * Manages session configuration and settings
 */
export class SessionManager {
  private websocketManager: WebSocketManager;

  constructor(websocketManager: WebSocketManager) {
    this.websocketManager = websocketManager;
  }

  /**
   * Configure session settings
   */
  configureSession(): boolean {
    if (!this.websocketManager || !this.websocketManager.isConnected) {
      console.error("Cannot configure session: WebSocket not connected");
      return false;
    }
    
    try {
      console.log("Configuring session...");
      
      const sessionConfig: SessionConfig = {
        "event_id": "config_event",
        "type": "session.update",
        "session": {
          "modalities": ["text", "audio"],
          "instructions": "You are a helpful voice assistant that speaks naturally with users. Keep responses concise and conversational.",
          "voice": "alloy",
          "input_audio_format": "pcm16",
          "output_audio_format": "pcm16",
          "input_audio_transcription": {
            "model": "whisper-1"
          },
          "turn_detection": {
            "type": "server_vad", 
            "threshold": 0.5,
            "prefix_padding_ms": 300,
            "silence_duration_ms": 1000
          },
          "temperature": 0.8,
          "max_response_output_tokens": 150
        }
      };
      
      return this.websocketManager.configureSession(sessionConfig);
    } catch (error) {
      console.error("Failed to configure session:", error);
      return false;
    }
  }
}
