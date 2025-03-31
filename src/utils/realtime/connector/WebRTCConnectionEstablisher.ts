
import { createPeerConnection } from "./PeerConnectionFactory";
import { setupPeerConnectionListeners } from "../WebRTCConnectionListeners";
import { setupDataChannelListeners } from "../WebRTCDataChannelHandler";
import { WebRTCOptions } from "../WebRTCTypes";
import { sendOffer } from "./OfferService";
import { ConnectionTimeout } from "./ConnectionTimeout";

/**
 * Handles establishing WebRTC connections with OpenAI
 */
export class WebRTCConnectionEstablisher {
  private timeout: ConnectionTimeout;
  
  constructor() {
    this.timeout = new ConnectionTimeout();
  }
  
  /**
   * Establish a WebRTC connection with OpenAI
   * @param options Configuration options for the connection
   * @param onStateChange Callback for connection state changes
   * @param onDataChannelOpen Callback for when the data channel opens
   * @param onError Callback for handling errors
   * @returns Object containing the peer connection and data channel if successful
   */
  async establish(
    apiKey: string,
    options: WebRTCOptions,
    onStateChange: (state: RTCPeerConnectionState) => void,
    onDataChannelOpen: () => void,
    onError: (error: unknown) => void
  ): Promise<{ pc: RTCPeerConnection, dc: RTCDataChannel } | null> {
    console.log("[WebRTCConnectionEstablisher] Starting connection process");
    
    try {
      // Create peer connection
      const pc = createPeerConnection();
      
      if (!pc) {
        console.error("[WebRTCConnectionEstablisher] Failed to create peer connection");
        throw new Error("Failed to create peer connection");
      }
      
      // Set up event listeners for the peer connection
      setupPeerConnectionListeners(pc, options, (state) => {
        console.log(`[WebRTCConnectionEstablisher] Connection state changed: ${state}`);
        onStateChange(state);
        
        // Clear timeout if connection is successful
        if (state === "connected") {
          this.timeout.clearTimeout();
        }
      });
      
      // Create data channel for sending/receiving events - critical for OpenAI's protocol
      console.log("[WebRTCConnectionEstablisher] Creating data channel 'oai-events'");
      const dc = pc.createDataChannel("oai-events");
      
      // Set up event listeners for the data channel
      setupDataChannelListeners(dc, options, onDataChannelOpen);
      
      // Create an offer and set local description
      console.log("[WebRTCConnectionEstablisher] Creating offer");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log("[WebRTCConnectionEstablisher] Local description set:", 
        pc.localDescription ? `type: ${pc.localDescription.type}, length: ${pc.localDescription.sdp?.length || 0}` : "null");
      
      if (!pc.localDescription) {
        console.error("[WebRTCConnectionEstablisher] No valid local description available");
        throw new Error("No valid local description available");
      }
      
      // Set a timeout for the connection
      this.timeout.setTimeout(() => {
        console.error("[WebRTCConnectionEstablisher] Connection timeout after 15 seconds");
        onError(new Error("Connection timeout after 15 seconds"));
      }, 15000);
      
      // Send the offer to OpenAI's Realtime API and get answer
      console.log("[WebRTCConnectionEstablisher] Sending SDP offer to OpenAI");
      const result = await sendOffer(
        pc.localDescription, 
        apiKey, 
        options.model || "gpt-4o-realtime-preview-2024-12-17"
      );
      
      if (!result.success) {
        console.error(`[WebRTCConnectionEstablisher] Failed to get valid answer: ${result.error}`);
        throw new Error(result.error || "Failed to send offer");
      }
      
      console.log("[WebRTCConnectionEstablisher] Received SDP answer from OpenAI");
      
      try {
        // Set remote description from OpenAI response
        await pc.setRemoteDescription(result.answer);
        
        console.log("[WebRTCConnectionEstablisher] Remote description set successfully");
        console.log("[WebRTCConnectionEstablisher] WebRTC connection established successfully");
        
        return { pc, dc };
      } catch (sdpError) {
        console.error("[WebRTCConnectionEstablisher] Error setting remote description:", sdpError);
        throw new Error(`Failed to set remote description: ${sdpError instanceof Error ? sdpError.message : String(sdpError)}`);
      }
    } catch (error) {
      console.error("[WebRTCConnectionEstablisher] Error connecting to OpenAI:", error);
      onError(error);
      return null;
    }
  }
  
  /**
   * Clean up any resources used during connection establishment
   */
  cleanup(): void {
    this.timeout.clearTimeout();
  }
}
