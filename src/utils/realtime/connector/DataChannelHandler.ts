
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
  private commitDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
  private lastCommitTime: number = 0;
  private readonly MIN_COMMIT_INTERVAL = 1500; // Minimum ms between commits
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;

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
    this.reconnectAttempts = 0;
    
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
          // Include more detailed information about the event
          let errorMessage = `Data channel error on '${dataChannel.label}'`;
          
          // Check if it's an RTCErrorEvent and extract more details if possible
          if (event instanceof RTCErrorEvent && event.error) {
            errorMessage += `: ${event.error.message || 'Unknown error'}`;
          }
          
          this.onError(new Error(errorMessage));
        }
      };
      
      dataChannel.onclose = () => {
        console.warn(`[DataChannelHandler] Data channel '${dataChannel.label}' closed unexpectedly`);
        this.dataChannelReady = false;
        
        // Only report as error if it was previously ready
        if (this.dataChannelReady) {
          if (this.onError) {
            this.onError(new Error(`Data channel '${dataChannel.label}' closed unexpectedly`));
          }
        } else if (this.reconnectAttempts < this.maxReconnectAttempts) {
          // Attempt to recover if we haven't exceeded max attempts
          this.reconnectAttempts++;
          console.log(`[DataChannelHandler] Attempting recovery (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          // The WebRTCConnectionManager should handle reconnection logic
          // so we don't need to do anything specific here
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
    
    // Increase timeout to 10 seconds
    this.dataChannelOpenTimeout = setTimeout(() => {
      if (this.dataChannel && this.dataChannel.readyState !== 'open') {
        console.error('[DataChannelHandler] Data channel open timed out after 10 seconds');
        if (this.onError) {
          this.onError(new Error('Data channel open timed out'));
        }
      }
      this.dataChannelOpenTimeout = null;
    }, 10000); // Increased to 10s from 5s
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
    
    // Reset reconnect attempts when channel is successfully ready
    if (ready) {
      this.reconnectAttempts = 0;
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
   * With debounce to prevent rapid commits
   */
  commitAudioBuffer(handleError: (error: any) => void): boolean {
    // Check if we can commit (channel is ready)
    if (!this.dataChannel || !this.dataChannelReady || this.dataChannel.readyState !== "open") {
      console.error(`[DataChannelHandler] Data channel not ready for committing audio, state: ${this.dataChannel?.readyState || 'null'}`);
      handleError(new Error(`Data channel not ready for committing audio, state: ${this.dataChannel?.readyState || 'null'}`));
      return false;
    }
    
    const now = Date.now();
    
    // Check if we're committing too frequently
    if (now - this.lastCommitTime < this.MIN_COMMIT_INTERVAL) {
      console.log(`[DataChannelHandler] Commit attempted too soon after previous commit (${now - this.lastCommitTime}ms), debouncing`);
      
      // Clear any existing debounce timeout
      if (this.commitDebounceTimeout) {
        clearTimeout(this.commitDebounceTimeout);
      }
      
      // Set a debounce timeout
      this.commitDebounceTimeout = setTimeout(() => {
        console.log("[DataChannelHandler] Executing debounced commit");
        this.executeCommit(handleError);
        this.commitDebounceTimeout = null;
      }, this.MIN_COMMIT_INTERVAL - (now - this.lastCommitTime));
      
      return true;
    }
    
    // Execute commit immediately if not too frequent
    return this.executeCommit(handleError);
  }
  
  /**
   * Actually execute the audio buffer commit
   */
  private executeCommit(handleError: (error: any) => void): boolean {
    try {
      console.log("[DataChannelHandler] Committing audio buffer");
      this.lastCommitTime = Date.now();
      AudioSender.commitAudioBuffer(this.dataChannel!, false);
      return true;
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
    
    if (this.commitDebounceTimeout) {
      clearTimeout(this.commitDebounceTimeout);
      this.commitDebounceTimeout = null;
    }
    
    this.dataChannel = null;
    this.dataChannelReady = false;
    this.reconnectAttempts = 0;
  }
}
