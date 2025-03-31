
import { WebRTCMessage, MessageMetadata } from "@/hooks/useWebRTCConnection/types";
import { saveMessage } from "@/services/messages/messageStorage";

export interface WebRTCMessageHandlerOptions {
  onTranscriptUpdate?: (text: string) => void;
  onTranscriptComplete?: () => void;
  onAudioData?: (base64Audio: string) => void;
  onAudioComplete?: () => void;
  onMessageReceived?: (message: WebRTCMessage) => void;
  onFinalTranscript?: (transcript: string) => void;
  instructions?: string;
}

/**
 * Handler for WebRTC messages
 */
export class WebRTCMessageHandler {
  private options: WebRTCMessageHandlerOptions;
  private currentTranscript: string = "";
  
  constructor(options: WebRTCMessageHandlerOptions = {}) {
    this.options = options;
  }

  /**
   * Process incoming WebRTC messages
   */
  handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebRTCMessage;
      
      // Log for debugging
      console.log(`[WebRTCMessageHandler] Received message: ${message.type}`, message);
      
      // Notify about all messages if callback is provided
      if (this.options.onMessageReceived) {
        this.options.onMessageReceived(message);
      }
      
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
          // Accumulate transcript text
          this.currentTranscript += message.delta;
          this.options.onTranscriptUpdate(this.currentTranscript);
        }
      } 
      else if (message.type === "response.audio_transcript.done") {
        // Transcript is complete
        if (this.options.onTranscriptComplete) {
          this.options.onTranscriptComplete();
          
          // Notify about final transcript if callback is provided
          if (this.options.onFinalTranscript && this.currentTranscript.trim()) {
            this.options.onFinalTranscript(this.currentTranscript);
            
            // Save the transcript to database with metadata
            this.saveTranscriptToDatabase();
          }
          
          // Reset current transcript
          this.currentTranscript = "";
        }
      }
      else if (message.type === "response.done") {
        // Response is complete - this is another signal that audio is done
        if (this.options.onAudioComplete) {
          this.options.onAudioComplete();
        }
      }
    } catch (error) {
      console.error("[WebRTCMessageHandler] Error handling message:", error);
    }
  }
  
  /**
   * Save transcript to database
   */
  private saveTranscriptToDatabase(): void {
    // Skip if transcript is empty
    if (!this.currentTranscript.trim()) {
      return;
    }
    
    // Save the transcript to the database with metadata
    saveMessage(this.currentTranscript, false, { 
      messageType: 'voice',
      instructions: this.options.instructions,
    }).catch(error => {
      console.error("[WebRTCMessageHandler] Error saving transcript:", error);
    });
  }
}
