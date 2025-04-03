import { TextMessageSender } from "./TextMessageSender";
import { AudioSender } from "./AudioSender";
import { updateSessionWithFullContext } from "@/services/context/unifiedContextProvider";

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
  private userId?: string;
  private baseInstructions?: string;

  constructor() {
    this.dataChannelReady = false;
    this.dataChannel = null;
  }
  
  /**
   * Set user ID for context updates
   */
  setUserId(userId?: string): void {
    this.userId = userId;
  }
  
  /**
   * Set base instructions for context updates
   */
  setBaseInstructions(instructions?: string): void {
    this.baseInstructions = instructions;
  }
  
  /**
   * Set the data channel
   */
  setDataChannel(dataChannel: RTCDataChannel | null, onError?: (error: any) => void): void {
    // Don't replace an existing open data channel with a new one
    if (this.dataChannel && 
        this.dataChannel.readyState === 'open' && 
        dataChannel && 
        dataChannel.label === this.dataChannel.label) {
      console.log(`[DataChannelHandler] Not replacing existing open data channel '${this.dataChannel.label}'`);
      return;
    }
    
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
        // Check if closure was unexpected
        const wasUnexpected = this.dataChannelReady;
        console.warn(`[DataChannelHandler] Data channel '${dataChannel.label}' closed ${wasUnexpected ? 'unexpectedly' : 'as expected'}`);
        
        this.dataChannelReady = false;
        
        // Only report as error if it was previously ready
        if (wasUnexpected) {
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
      
      // Track when the data channel actually opens
      dataChannel.onopen = () => {
        console.log(`[DataChannelHandler] Data channel '${dataChannel.label}' opened`);
        this.dataChannelReady = true;
        
        // Clear timeout once the channel is opened
        if (this.dataChannelOpenTimeout) {
          clearTimeout(this.dataChannelOpenTimeout);
          this.dataChannelOpenTimeout = null;
        }
        
        // Reset reconnect attempts on successful opening
        this.reconnectAttempts = 0;
        
        // If we have user ID and base instructions, trigger Phase 2 context loading
        if (this.userId && this.baseInstructions && dataChannel.label === 'data') {
          console.log('[DataChannelHandler] Data channel open event - triggering context update');
          this.initiateContextUpdate(dataChannel);
        }
      };
      
      // Add message event handler
      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'session.created' || message.type === 'session.updated') {
            console.log(`[DataChannelHandler] Received ${message.type} - session is ready`);
            
            // If we haven't done the context update yet and we have user info, do it now
            if (this.userId && this.baseInstructions && dataChannel.label === 'data') {
              // Wait a brief moment to ensure session is fully initialized
              setTimeout(() => {
                this.initiateContextUpdate(dataChannel);
              }, 500);
            }
          }
        } catch (error) {
          // If we can't parse the message as JSON, just ignore it
        }
      };
    } else if (dataChannel && dataChannel.readyState === 'open') {
      // If the channel is already open, mark it as ready immediately
      console.log(`[DataChannelHandler] Data channel '${dataChannel.label}' already open`);
      this.dataChannelReady = true;
      this.reconnectAttempts = 0;
      
      // If we have user ID and base instructions, trigger Phase 2 context loading
      if (this.userId && this.baseInstructions && dataChannel.label === 'data') {
        console.log('[DataChannelHandler] Data channel already open - triggering immediate context update');
        this.initiateContextUpdate(dataChannel);
      }
    }
  }
  
  /**
   * Initiate context update for Phase 2
   */
  private initiateContextUpdate(dataChannel: RTCDataChannel): void {
    if (!this.userId || !this.baseInstructions) return;
    
    // Only update context once
    const userId = this.userId;
    const baseInstructions = this.baseInstructions;
    
    // Clear these values so we don't try to update again
    this.userId = undefined;
    this.baseInstructions = undefined;
    
    console.log('[DataChannelHandler] Initiating context update (Phase 2)');
    
    // Update session with full context
    updateSessionWithFullContext(
      dataChannel,
      baseInstructions,
      {
        userId: userId,
        activeMode: 'voice',
        sessionStarted: true
      }
    ).catch(error => {
      console.error('[DataChannelHandler] Error during context update:', error);
      // Don't propagate the error - this is a background operation
    });
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
        console.error(`[DataChannelHandler] Data channel '${this.dataChannel.label}' open timed out after 10 seconds`);
        if (this.onError) {
          this.onError(new Error(`Data channel '${this.dataChannel.label}' open timed out`));
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
   * Get the data channel
   */
  getDataChannel(): RTCDataChannel | null {
    return this.dataChannel;
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
    
    // Don't explicitly close the data channel here, just remove our reference to it
    // This prevents premature closure which can result in "User-Initiated Abort" errors
    console.log("[DataChannelHandler] Cleaning up references (but not closing data channel)");
    this.dataChannel = null;
    this.dataChannelReady = false;
    this.reconnectAttempts = 0;
    this.userId = undefined;
    this.baseInstructions = undefined;
  }
}
