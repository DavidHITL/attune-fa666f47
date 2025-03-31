
import { WebRTCMessage } from "@/hooks/useWebRTCConnection";

export interface WebRTCMessageHandlerOptions {
  onTranscriptUpdate?: (text: string) => void;
  onTranscriptComplete?: () => void;
  onAudioData?: (base64Audio: string) => void;
  onAudioComplete?: () => void;
}

/**
 * Handler for WebRTC messages
 */
export class WebRTCMessageHandler {
  private options: WebRTCMessageHandlerOptions;
  
  constructor(options: WebRTCMessageHandlerOptions = {}) {
    this.options = options;
  }

  /**
   * Process incoming WebRTC messages
   */
  handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebRTCMessage;
      
      // Handle different message types
      if (message.type === "response.audio.delta") {
        // Handle incoming audio data
        if (this.options.onAudioData && message.delta) {
          this.options.onAudioData(message.delta);
        }
      } 
      else if (message.type === "response.audio.done") {
        // AI has finished speaking
        if (this.options.onAudioComplete) {
          this.options.onAudioComplete();
        }
      }
      else if (message.type === "response.audio_transcript.delta") {
        // Update transcript with new text
        if (this.options.onTranscriptUpdate && message.delta) {
          this.options.onTranscriptUpdate(message.delta);
        }
      } 
      else if (message.type === "response.audio_transcript.done") {
        // Transcript is complete
        if (this.options.onTranscriptComplete) {
          this.options.onTranscriptComplete();
        }
      }
    } catch (error) {
      console.error("[WebRTCMessageHandler] Error handling message:", error);
    }
  }
}
