
import { TextMessageSender } from "./TextMessageSender";
import { AudioSender } from "./AudioSender";
import { updateSessionWithFullContext } from "@/services/context/unifiedContextProvider";
import { debounce } from "@/utils/debounce";

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
  private contextUpdateSent: boolean = false;
  private channelClosingIntentionally: boolean = false;
  private contextUpdateAttempts: number = 0;
  private maxContextUpdateAttempts: number = 2;
  private onDataChannelOpen: (() => void) | null = null;

  constructor() {
    this.dataChannelReady = false;
    this.dataChannel = null;
  }
  
  /**
   * Set callback to be executed when data channel opens
   */
  setOnDataChannelOpen(callback: () => void): void {
    this.onDataChannelOpen = callback;
    
    // If the channel is already open, call the callback immediately
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      console.log("[DataChannelHandler] Channel already open, calling onDataChannelOpen callback immediately");
      callback();
    }
  }
  
  /**
   * Set user ID for context updates
   */
  setUserId(userId?: string): void {
    if (!userId) {
      console.warn("[DataChannelHandler] Setting empty userId for context updates");
    } else {
      console.log(`[DataChannelHandler] Setting userId ${userId.substring(0, 8)}... for context updates`);
    }
    this.userId = userId;
  }
  
  /**
   * Set base instructions for context updates
   */
  setBaseInstructions(instructions?: string): void {
    if (!instructions) {
      console.warn("[DataChannelHandler] Setting empty baseInstructions for context updates");
    } else {
      console.log("[DataChannelHandler] Setting baseInstructions for context updates");
    }
    this.baseInstructions = instructions;
  }
  
  /**
   * Reset the context update status
   */
  resetContextUpdateStatus(): void {
    this.contextUpdateSent = false;
    this.contextUpdateAttempts = 0;
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
    
    // Reset channel closing flag when setting a new channel
    this.channelClosingIntentionally = false;
    this.dataChannel = dataChannel;
    this.onError = onError || null;
    this.reconnectAttempts = 0;
    this.contextUpdateAttempts = 0;
    
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
        const wasIntentional = this.channelClosingIntentionally;
        console.warn(`[DataChannelHandler] Data channel '${dataChannel.label}' closed ${wasIntentional ? 'intentionally' : 'unexpectedly'}`);
        
        this.dataChannelReady = false;
        
        // Only report as error if it was not an intentional closure and was previously ready
        if (!wasIntentional && this.dataChannelReady) {
          if (this.onError) {
            this.onError(new Error(`Data channel '${dataChannel.label}' closed unexpectedly`));
          }
        } else if (!wasIntentional && this.reconnectAttempts < this.maxReconnectAttempts) {
          // Attempt to recover if we haven't exceeded max attempts
          this.reconnectAttempts++;
          console.log(`[DataChannelHandler] Attempting recovery (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          
          // The WebRTCConnectionManager should handle reconnection logic
        }
        
        // Reset the intentional closing flag
        this.channelClosingIntentionally = false;
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
        
        // Execute the data channel open callback if provided
        if (this.onDataChannelOpen) {
          console.log("[DataChannelHandler] Executing onDataChannelOpen callback");
          this.onDataChannelOpen();
        }
      };
      
      // Add message event handler
      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'session.created' || message.type === 'session.updated') {
            console.log(`[DataChannelHandler] Received ${message.type} - session is ready`);
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
      
      // Execute the data channel open callback if provided
      if (this.onDataChannelOpen) {
        console.log("[DataChannelHandler] Channel already open, executing onDataChannelOpen callback");
        this.onDataChannelOpen();
      }
    }
  }
  
  /**
   * Initiate context update for Phase 2
   */
  initiateContextUpdate(dataChannel: RTCDataChannel): void {
    // Increment attempt counter
    this.contextUpdateAttempts++;
    
    if (this.contextUpdateAttempts > this.maxContextUpdateAttempts) {
      console.error(`[DataChannelHandler] Exceeded max context update attempts (${this.maxContextUpdateAttempts})`);
      return;
    }
    
    if (!this.baseInstructions) {
      console.error("[DataChannelHandler] Cannot send context update - missing base instructions");
      return;
    }
    
    if (this.contextUpdateSent) {
      console.log("[DataChannelHandler] Context update already sent - skipping");
      return;
    }
    
    // Verify the data channel is open before proceeding
    if (dataChannel.readyState !== 'open') {
      console.error(`[DataChannelHandler] Cannot update context: Data channel not open, state: ${dataChannel.readyState}`);
      
      // Schedule a retry if we haven't exceeded max attempts
      if (this.contextUpdateAttempts < this.maxContextUpdateAttempts) {
        console.log(`[DataChannelHandler] Will retry context update when channel is open (attempt ${this.contextUpdateAttempts}/${this.maxContextUpdateAttempts})`);
      }
      return;
    }
    
    // Mark that we're sending the context update
    const userId = this.userId; // May be undefined for guest sessions
    const baseInstructions = this.baseInstructions;
    
    console.log('[DataChannelHandler] Initiating context update (Phase 2)');
    if (userId) {
      console.log(`[DataChannelHandler] Using userId: ${userId.substring(0, 8)}... for context enrichment`);
    } else {
      console.log('[DataChannelHandler] No userId available - using base instructions only');
    }
    
    // Use a try-catch block to handle potential errors during context update
    try {
      // Update session with full context
      updateSessionWithFullContext(
        dataChannel,
        baseInstructions,
        {
          userId: userId,
          activeMode: 'voice',
          sessionStarted: true
        }
      ).then(success => {
        // Mark update as sent only after successful completion
        if (success) {
          console.log('[DataChannelHandler] Context update sent successfully');
          this.contextUpdateSent = true;
        } else {
          console.error('[DataChannelHandler] Context update failed');
          
          // Retry if we haven't exceeded max attempts
          if (this.contextUpdateAttempts < this.maxContextUpdateAttempts) {
            console.log(`[DataChannelHandler] Will retry context update (attempt ${this.contextUpdateAttempts}/${this.maxContextUpdateAttempts})`);
            
            // Wait a moment before retrying
            setTimeout(() => {
              if (dataChannel.readyState === 'open') {
                this.initiateContextUpdate(dataChannel);
              }
            }, 1000);
          }
        }
      }).catch(error => {
        console.error('[DataChannelHandler] Error during context update:', error);
        // Don't propagate the error - this is a background operation
        
        // Retry if we haven't exceeded max attempts
        if (this.contextUpdateAttempts < this.maxContextUpdateAttempts) {
          console.log(`[DataChannelHandler] Will retry context update after error (attempt ${this.contextUpdateAttempts}/${this.maxContextUpdateAttempts})`);
          
          // Wait a moment before retrying
          setTimeout(() => {
            if (dataChannel.readyState === 'open') {
              this.initiateContextUpdate(dataChannel);
            }
          }, 1000);
        }
      });
    } catch (error) {
      console.error('[DataChannelHandler] Exception during context update initiation:', error);
    }
  }
  
  /**
   * Close the data channel explicitly, marking it as an intentional closure
   */
  closeDataChannel(): void {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      console.log(`[DataChannelHandler] Intentionally closing data channel '${this.dataChannel.label}'`);
      this.channelClosingIntentionally = true;
      this.dataChannel.close();
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
        console.error(`[DataChannelHandler] Data channel '${this.dataChannel.label}' open timed out after 10 seconds`);
        if (this.onError) {
          this.onError(new Error(`Data channel '${this.dataChannel.label}' open timed out`));
        }
      }
      this.dataChannelOpenTimeout = null;
    }, 10000); // 10s timeout
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
   * Send a text message to OpenAI with improved error handling
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
    
    // Mark that we're intentionally closing if we still have a channel
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.channelClosingIntentionally = true;
      // We don't explicitly close here, as the PeerConnection will handle this
    }
    
    console.log("[DataChannelHandler] Cleaning up references (but not closing data channel)");
    this.dataChannel = null;
    this.dataChannelReady = false;
    this.reconnectAttempts = 0;
    this.userId = undefined;
    this.baseInstructions = undefined;
    this.contextUpdateSent = false;
  }
}
