
import { TextMessageSender } from "./TextMessageSender";
import { AudioSender } from "./AudioSender";

/**
 * Handles data channel operations
 */
export class DataChannelHandler {
  private dataChannelReady: boolean = false;
  private dataChannel: RTCDataChannel | null = null;

  constructor() {
    this.dataChannelReady = false;
    this.dataChannel = null;
  }
  
  /**
   * Set the data channel
   */
  setDataChannel(dataChannel: RTCDataChannel | null): void {
    this.dataChannel = dataChannel;
  }
  
  /**
   * Set data channel ready status
   */
  setDataChannelReady(ready: boolean): void {
    this.dataChannelReady = ready;
  }

  /**
   * Check if the data channel is ready for sending
   */
  isDataChannelReady(): boolean {
    return this.dataChannelReady && !!this.dataChannel && this.dataChannel.readyState === "open";
  }
  
  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(text: string, handleError: (error: any) => void): boolean {
    if (!this.dataChannel || !this.dataChannelReady || this.dataChannel.readyState !== "open") {
      console.error(`[DataChannelHandler] Data channel not ready for sending text, state: ${this.dataChannel?.readyState || 'null'}`);
      return false;
    }
    
    try {
      return TextMessageSender.sendTextMessage(this.dataChannel, text);
    } catch (error) {
      console.error("[DataChannelHandler] Error sending message:", error);
      handleError(error);
      return false;
    }
  }
  
  /**
   * Commit the audio buffer to indicate end of speech
   */
  commitAudioBuffer(handleError: (error: any) => void): boolean {
    if (!this.dataChannel || !this.dataChannelReady || this.dataChannel.readyState !== "open") {
      console.error(`[DataChannelHandler] Data channel not ready for committing audio, state: ${this.dataChannel?.readyState || 'null'}`);
      return false;
    }
    
    try {
      console.log("[DataChannelHandler] Committing audio buffer");
      return AudioSender.commitAudioBuffer(this.dataChannel, false);
    } catch (error) {
      console.error("[DataChannelHandler] Error committing audio buffer:", error);
      handleError(error);
      return false;
    }
  }
}
