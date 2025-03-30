
import { EventEmitter } from '../EventEmitter';

/**
 * Manages WebSocket session state and configuration
 */
export class SessionHandler {
  private sessionEstablished: boolean = false;
  private eventEmitter: EventEmitter;

  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }

  /**
   * Mark session as established
   */
  setSessionEstablished(): void {
    this.sessionEstablished = true;
    this.eventEmitter.dispatchEvent('session.created', { status: "created" });
  }

  /**
   * Check if session is established
   */
  isSessionEstablished(): boolean {
    return this.sessionEstablished;
  }

  /**
   * Configure session settings after session is created
   */
  configureSession(websocketManager: any): void {
    if (!websocketManager) {
      console.error("Cannot configure session: WebSocketManager not available");
      return;
    }
    
    console.log("Configuring session with optimal settings");
    
    const sessionConfig = {
      "event_id": `event_${Date.now()}`,
      "type": "session.update",
      "session": {
        "modalities": ["text", "audio"],
        "instructions": "You are a helpful AI assistant that responds concisely and clearly.",
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
        "max_response_output_tokens": "inf"
      }   
    };
    
    websocketManager.send(sessionConfig);
  }
}
