
import { WebRTCOptions } from "../WebRTCTypes";
import { setupDataChannelListeners } from "../WebRTCDataChannelHandler";
import { updateSessionWithFullContext } from "@/services/context/unifiedContextProvider";

/**
 * Handler for WebRTC data channels
 */
export class DataChannelHandler {
  private dataChannel: RTCDataChannel | null = null;
  private isDataChannelReady: boolean = false;
  private onDataChannelOpen: (() => void) | null = null;
  private userId: string | undefined = undefined;
  private baseInstructions: string | undefined = undefined;
  private contextUpdateAttempted: boolean = false;
  private contextUpdateSuccessful: boolean = false;
  private contextUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * Set the data channel and initialize listeners
   */
  setDataChannel(dc: RTCDataChannel, onError: (error: any) => void): void {
    console.log(`[DataChannelHandler] Setting data channel: ${dc.label}, readyState: ${dc.readyState}`);
    this.dataChannel = dc;
    
    // Override the existing onopen handler to call our onDataChannelOpen callback
    const existingOnOpen = dc.onopen;
    dc.onopen = (event) => {
      console.log(`[DataChannelHandler] [DataChannel] Data channel '${dc.label}' opened, readyState: ${dc.readyState}`);
      
      // Call existing onopen handler if it exists
      if (existingOnOpen && typeof existingOnOpen === 'function') {
        existingOnOpen.call(dc, event);
      }
      
      // Mark channel as ready
      this.isDataChannelReady = true;
      
      // Call our onDataChannelOpen callback if provided
      if (this.onDataChannelOpen) {
        console.log("[DataChannelHandler] [DataChannel] Calling onDataChannelOpen callback");
        this.onDataChannelOpen();
      }
    };
    
    // Add extra error handling
    const existingOnError = dc.onerror;
    dc.onerror = (event) => {
      console.error(`[DataChannelHandler] [DataChannel] [ERROR] Data channel '${dc.label}' error:`, event);
      
      // Call existing onerror handler if it exists
      if (existingOnError && typeof existingOnError === 'function') {
        existingOnError.call(dc, event);
      }
      
      // Propagate the error
      onError(event);
    };
  }

  /**
   * Set the callback to be called when the data channel opens
   */
  setOnDataChannelOpen(callback: () => void): void {
    console.log("[DataChannelHandler] Setting onDataChannelOpen callback");
    this.onDataChannelOpen = callback;
    
    // If the data channel is already open, call the callback immediately
    if (this.dataChannel && this.dataChannel.readyState === 'open' && this.isDataChannelReady) {
      console.log("[DataChannelHandler] [DataChannel] Data channel already open, calling onDataChannelOpen immediately");
      callback();
    }
  }

  /**
   * Check if the data channel is ready
   */
  isChannelReady(): boolean {
    return this.isDataChannelReady;
  }

  /**
   * Update the data channel ready state
   */
  setDataChannelReady(ready: boolean): void {
    console.log(`[DataChannelHandler] [DataChannel] Setting data channel ready state to: ${ready}`);
    this.isDataChannelReady = ready;
  }

  /**
   * Get the data channel
   */
  getDataChannel(): RTCDataChannel | null {
    return this.dataChannel;
  }

  /**
   * Close the data channel
   */
  closeDataChannel(): void {
    if (this.dataChannel) {
      console.log(`[DataChannelHandler] [DataChannel] Closing data channel: ${this.dataChannel.label}`);
      try {
        this.dataChannel.close();
      } catch (error) {
        console.error("[DataChannelHandler] [DataChannel] [ERROR] Error closing data channel:", error);
      }
    }
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log("[DataChannelHandler] Cleanup");
    
    // Clear any pending timeout
    if (this.contextUpdateTimeout) {
      clearTimeout(this.contextUpdateTimeout);
      this.contextUpdateTimeout = null;
    }
    
    // Close the data channel if it exists
    this.closeDataChannel();
    
    // Reset state
    this.dataChannel = null;
    this.isDataChannelReady = false;
    this.onDataChannelOpen = null;
    this.contextUpdateAttempted = false;
    this.contextUpdateSuccessful = false;
  }
  
  /**
   * Set user ID for context loading
   */
  setUserId(userId: string): void {
    console.log(`[DataChannelHandler] [ContextSetup] Setting userId: ${userId.substring(0, 8)}...`);
    this.userId = userId;
  }
  
  /**
   * Set base instructions for context loading
   */
  setBaseInstructions(instructions: string): void {
    console.log("[DataChannelHandler] [ContextSetup] Setting base instructions");
    this.baseInstructions = instructions;
  }
  
  /**
   * Reset context update status
   */
  resetContextUpdateStatus(): void {
    console.log("[DataChannelHandler] [ContextSetup] Resetting context update status");
    this.contextUpdateAttempted = false;
    this.contextUpdateSuccessful = false;
    
    // Clear any pending timeout
    if (this.contextUpdateTimeout) {
      clearTimeout(this.contextUpdateTimeout);
      this.contextUpdateTimeout = null;
    }
  }
  
  /**
   * Check if context update has been successful
   */
  isContextUpdateSuccessful(): boolean {
    return this.contextUpdateSuccessful;
  }
  
  /**
   * Initiate context update with validation and timeout
   */
  initiateContextUpdate(dataChannel: RTCDataChannel): void {
    // Avoid duplicate context updates
    if (this.contextUpdateAttempted) {
      console.log("[DataChannelHandler] [ContextUpdate] Context update already attempted, skipping");
      return;
    }
    
    console.log("[DataChannelHandler] [ContextUpdate] Initiating context update");
    this.contextUpdateAttempted = true;
    
    // Verify prerequisites
    if (!this.userId || !this.baseInstructions) {
      console.error("[DataChannelHandler] [ContextUpdate] [ERROR] Cannot update context: Missing userId or instructions");
      return;
    }
    
    // Check data channel state
    if (dataChannel.readyState !== 'open') {
      console.error(`[DataChannelHandler] [ContextUpdate] [ERROR] Cannot update context: Data channel not open (state: ${dataChannel.readyState})`);
      
      // Set a timeout to monitor data channel opening
      this.contextUpdateTimeout = setTimeout(() => {
        if (dataChannel.readyState !== 'open') {
          console.error(`[DataChannelHandler] [ContextUpdate] [ERROR] Data channel failed to open within timeout period (10 seconds)`);
        } else if (!this.contextUpdateSuccessful) {
          console.log("[DataChannelHandler] [ContextUpdate] Data channel is now open, retrying context update");
          this.sendContextUpdate(dataChannel);
        }
      }, 10000); // 10 second timeout
      
      return;
    }
    
    // Send context update
    this.sendContextUpdate(dataChannel);
  }
  
  /**
   * Send context update through data channel
   */
  private async sendContextUpdate(dataChannel: RTCDataChannel): Promise<void> {
    try {
      console.log(`[DataChannelHandler] [ContextUpdate] Sending context update, data channel state: ${dataChannel.readyState}`);
      
      // Double check the data channel is still open
      if (dataChannel.readyState !== 'open') {
        console.error(`[DataChannelHandler] [ContextUpdate] [ERROR] Data channel not open (state: ${dataChannel.readyState})`);
        return;
      }
      
      // Send the context update
      const success = await updateSessionWithFullContext(
        dataChannel,
        this.baseInstructions!,
        {
          userId: this.userId,
          activeMode: 'voice',
          sessionStarted: true
        }
      );
      
      // Update status based on result
      if (success) {
        console.log("[DataChannelHandler] [ContextUpdate] Context update successful");
        this.contextUpdateSuccessful = true;
        
        // Clear any pending timeout
        if (this.contextUpdateTimeout) {
          clearTimeout(this.contextUpdateTimeout);
          this.contextUpdateTimeout = null;
        }
      } else {
        console.error("[DataChannelHandler] [ContextUpdate] [ERROR] Context update failed");
      }
    } catch (error) {
      console.error("[DataChannelHandler] [ContextUpdate] [ERROR] Exception during context update:", error);
      console.error("[DataChannelHandler] [ContextUpdate] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    }
  }
}
