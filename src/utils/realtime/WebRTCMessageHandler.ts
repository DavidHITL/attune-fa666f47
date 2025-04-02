
import { MessageMetadata } from "@/services/messages/messageUtils";
import { logContextVerification } from "@/services/context/unifiedContextProvider";

export interface MessageHandlerOptions {
  onTranscriptUpdate: (text: string) => void;
  onTranscriptComplete: () => void;
  onAudioData: (base64Audio: string) => void;
  onAudioComplete: () => void;
  onMessageReceived: (message: any) => void;
  onFinalTranscript: (transcript: string) => void;
  instructions?: string;
  userId?: string;
}

export interface WebRTCMessage {
  type: string;
  content: string;
}

/**
 * Class to handle messages received from the WebRTC data channel
 */
export class WebRTCMessageHandler {
  private options: MessageHandlerOptions;

  constructor(options: MessageHandlerOptions) {
    this.options = options;
  }

  /**
   * Update the options for the message handler
   * @param newOptions New options to use
   */
  public updateOptions(newOptions: Partial<MessageHandlerOptions>) {
    this.options = {
      ...this.options,
      ...newOptions
    };
  }

  /**
   * Handle a message received from the data channel
   * @param event Message event from the data channel
   */
  public async handleMessage(event: MessageEvent) {
    try {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "audio.data":
          this.options.onAudioData(data.payload.base64);
          break;
        case "audio.complete":
          this.options.onAudioComplete();
          break;
        case "transcription.update":
          this.options.onTranscriptUpdate(data.payload.text);
          break;
        case "transcription.complete":
          this.options.onTranscriptComplete();
          break;
        case "final.transcription":
          this.options.onFinalTranscript(data.payload.text);
          break;
        case "message":
          this.options.onMessageReceived({ type: "message", content: data.payload.text });
          break;
        default:
          console.warn(`[MessageHandler] Unknown message type: ${data.type}`);
      }

      // Log context verification data
      await logContextVerification({
        userId: this.options.userId || 'unknown',
        activeMode: 'voice',
        sessionStarted: true,
        sessionProgress: 0
      }, this.options.instructions);
      
    } catch (error) {
      console.error("[MessageHandler] Error handling message:", error);
    }
  }
}
