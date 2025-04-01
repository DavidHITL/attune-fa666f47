
import { createPeerConnection } from "./PeerConnectionFactory";
import { setupPeerConnectionListeners } from "../WebRTCConnectionListeners";
import { setupDataChannelListeners } from "../WebRTCDataChannelHandler";
import { WebRTCOptions } from "../WebRTCTypes";
import { sendOffer } from "./OfferService";
import { ConnectionTimeout } from "./ConnectionTimeout";
import { SdpOfferAnalyzer } from "./SdpOfferAnalyzer";
import { AudioTrackManager } from "./AudioTrackManager";
import { ConnectionPromiseHandler } from "./ConnectionPromiseHandler";

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
   * @param apiKey The ephemeral API key for authentication
   * @param options Configuration options for the connection
   * @param onStateChange Callback for connection state changes
   * @param onDataChannelOpen Callback for when the data channel opens
   * @param onError Callback for handling errors
   * @param audioTrack Optional audio track to add to the peer connection
   * @returns Object containing the peer connection and data channel if successful
   */
  async establish(
    apiKey: string,
    options: WebRTCOptions,
    onStateChange: (state: RTCPeerConnectionState) => void,
    onDataChannelOpen: () => void,
    onError: (error: unknown) => void,
    audioTrack?: MediaStreamTrack
  ): Promise<{ pc: RTCPeerConnection, dc: RTCDataChannel } | null> {
    console.log("[WebRTCConnectionEstablisher] Starting connection process");
    
    try {
      // Step 1: Create peer connection with ICE servers configuration
      const pc = createPeerConnection();
      
      if (!pc) {
        console.error("[WebRTCConnectionEstablisher] Failed to create peer connection");
        throw new Error("Failed to create peer connection");
      }
      
      // Step 2: Set up event listeners for the peer connection
      setupPeerConnectionListeners(pc, options, (state) => {
        console.log(`[WebRTCConnectionEstablisher] Connection state changed: ${state}`);
        onStateChange(state);
        
        // Clear timeout if connection is successful
        if (state === "connected") {
          this.timeout.clearTimeout();
        }
      });
      
      // Set up direct audio track handling
      if (options.onTrack) {
        console.log("[WebRTCConnectionEstablisher] Setting up ontrack handler for direct audio playback");
        pc.ontrack = (event) => {
          console.log("[WebRTCConnectionEstablisher] Received track:", event.track.kind, event.track.id);
          options.onTrack!(event);
        };
      }
      
      // Step 3: Create data channel for sending/receiving events - critical for OpenAI's protocol
      console.log("[WebRTCConnectionEstablisher] Creating data channel 'oai-events'");
      const dc = pc.createDataChannel("oai-events");
      
      // Set up event listeners for the data channel
      setupDataChannelListeners(dc, options, onDataChannelOpen);
      
      // Step 4: Add the audio track to the peer connection - this is the key change
      // We'll now prioritize directly adding the audio track to the peer connection
      if (audioTrack) {
        console.log("[WebRTCConnectionEstablisher] Adding audio track directly to peer connection:", 
          audioTrack.label || "Unnamed track",
          "- Enabled:", audioTrack.enabled,
          "- ID:", audioTrack.id);
        
        // Create a MediaStream to hold the track
        const mediaStream = new MediaStream([audioTrack]);
        
        // Add the track to the peer connection
        pc.addTrack(audioTrack, mediaStream);
        console.log("[WebRTCConnectionEstablisher] Audio track added to peer connection");
      } else {
        // If no audio track provided, we'll try to get one from the microphone
        console.log("[WebRTCConnectionEstablisher] No audio track provided, attempting to add one");
        await AudioTrackManager.addAudioTrack(pc);
      }
      
      // Step 5: Create an offer and set local description
      console.log("[WebRTCConnectionEstablisher] Creating offer");
      const offer = await pc.createOffer();
      
      // Log SDP offer details - including checking for audio media section
      if (offer.sdp) {
        SdpOfferAnalyzer.analyzeSdpOffer(offer.sdp);
      } else {
        console.warn("[WebRTCConnectionEstablisher] SDP offer is empty!");
      }
      
      // Step 6: Set the local description on the peer connection
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
      
      // Step 7: Send the offer to OpenAI's Realtime API and get answer
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
        // Step 8: Set remote description from OpenAI response
        console.log("[WebRTCConnectionEstablisher] Setting remote description");
        await pc.setRemoteDescription(result.answer);
        console.log("[WebRTCConnectionEstablisher] Remote description set successfully");
        
        try {
          // Step 9: Wait for the connection to be established
          console.log("[WebRTCConnectionEstablisher] Waiting for connection to be established");
          await ConnectionPromiseHandler.createConnectionPromise(pc);
          console.log("[WebRTCConnectionEstablisher] WebRTC connection established successfully");
          return { pc, dc };
        } catch (connectionError) {
          console.error("[WebRTCConnectionEstablisher] Connection error:", connectionError);
          throw connectionError;
        }
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
