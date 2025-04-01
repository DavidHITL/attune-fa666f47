
import { TextMessageSender } from "./TextMessageSender";
import { AudioSender } from "./AudioSender";

/**
 * Handles data channel operations
 */
export class DataChannelHandler {
  private dataChannelReady: boolean = false;
  private dataChannel: RTCDataChannel | null = null;
  private dataChannelOpenTimeout: ReturnType<typeof setTimeout> | null = null;
  private onError: ((error: any) => void) | null = null;

  constructor() {
    this.dataChannelReady = false;
    this.dataChannel = null;
  }
  
  /**
   * Set the data channel
   */
  setDataChannel(dataChannel: RTCDataChannel | null, onError?: (error: any) => void): void {
    this.dataChannel = dataChannel;
    this.onError = onError || null;
    
    // Clear any existing timeout
    if (this.dataChannelOpenTimeout) {
      clearTimeout(this.dataChannelOpenTimeout);
      this.dataChannelOpenTimeout = null;
    }
    
    // Set up a timeout for the data channel to open
    if (dataChannel && dataChannel.readyState !== 'open') {
      this.startOpenTimeout();
      
      // Add error and close event handlers
      dataChannel.onerror = (event) => {
        console.error(`[DataChannelHandler] Data channel error on '${dataChannel.label}':`, event);
        if (this.onError) {
          this.onError(new Error(`Data channel error on '${dataChannel.label}'`));
        }
      };
      
      dataChannel.onclose = () => {
        console.warn(`[DataChannelHandler] Data channel '${dataChannel.label}' closed unexpectedly`);
        this.dataChannelReady = false;
        
        // Only report as error if it was previously ready
        if (this.dataChannelReady && this.onError) {
          this.onError(new Error(`Data channel '${dataChannel.label}' closed unexpectedly`));
        }
      };
    }
  }
  
  /**
   * Start a timeout for data channel to open
   */
  private startOpenTimeout(): void {
    // Clear any existing timeout
    if (this.dataChannelOpenTimeout) {
      clearTimeout(this.dataChannelOpenTimeout);
    }
    
    // Set a 5 second timeout for the data channel to open
    this.dataChannelOpenTimeout = setTimeout(() => {
      if (this.dataChannel && this.dataChannel.readyState !== 'open') {
        console.error('[DataChannelHandler] Data channel open timed out after 5 seconds');
        if (this.onError) {
          this.onError(new Error('Data channel open timed out'));
        }
      }
      this.dataChannelOpenTimeout = null;
    }, 5000);
  }
  
  /**
   * Set data channel ready status
   */
  setDataChannelReady(ready: boolean): void {
    this.dataChannelReady = ready;
    
    // Clear timeout once the channel is ready
    if (ready && this.dataChannelOpenTimeout) {
      clearTimeout(this.dataChannelOpenTimeout);
      this.dataChannelOpenTimeout = null;
    }
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
      handleError(new Error(`Data channel not ready for sending text, state: ${this.dataChannel?.readyState || 'null'}`));
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
      handleError(new Error(`Data channel not ready for committing audio, state: ${this.dataChannel?.readyState || 'null'}`));
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
  
  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.dataChannelOpenTimeout) {
      clearTimeout(this.dataChannelOpenTimeout);
      this.dataChannelOpenTimeout = null;
    }
    
    this.dataChannel = null;
    this.dataChannelReady = false;
  }
}
