
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
      
      // Step 3: Create data channel for sending/receiving events - critical for OpenAI's protocol
      console.log("[WebRTCConnectionEstablisher] Creating data channel 'oai-events'");
      const dc = pc.createDataChannel("oai-events");
      
      // Set up event listeners for the data channel
      setupDataChannelListeners(dc, options, onDataChannelOpen);
      
      // Step 4: Add the audio track to the peer connection
      // This is a critical step for voice-enabled applications
      if (audioTrack) {
        console.log("[WebRTCConnectionEstablisher] Adding provided audio track to peer connection:", 
          audioTrack.label || "Unnamed track", 
          "- Enabled:", audioTrack.enabled, 
          "- ID:", audioTrack.id);
        
        // Create a new MediaStream with the audio track
        const mediaStream = new MediaStream([audioTrack]);
        
        // Add the track to the peer connection, associating it with the stream
        const sender = pc.addTrack(audioTrack, mediaStream);
        console.log("[WebRTCConnectionEstablisher] Audio track added successfully with sender ID:", sender.track?.id || "unknown");
      } else {
        // If no audio track provided, try to get one from microphone
        try {
          console.log("[WebRTCConnectionEstablisher] No audio track provided, requesting microphone access");
          const mediaStream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 24000 // OpenAI recommends this sample rate
            } 
          });
          
          const audioTracks = mediaStream.getAudioTracks();
          if (audioTracks.length > 0) {
            const micTrack = audioTracks[0];
            console.log("[WebRTCConnectionEstablisher] Adding microphone track to peer connection:", 
              micTrack.label || "Unnamed microphone", 
              "- Enabled:", micTrack.enabled, 
              "- ID:", micTrack.id);
            
            // Add the first audio track from the microphone to the peer connection
            const sender = pc.addTrack(micTrack, mediaStream);
            console.log("[WebRTCConnectionEstablisher] Microphone track added successfully with sender ID:", sender.track?.id || "unknown");
          } else {
            console.warn("[WebRTCConnectionEstablisher] No audio tracks found in media stream");
          }
        } catch (micError) {
          console.warn("[WebRTCConnectionEstablisher] Could not access microphone, continuing without audio track:", micError);
          // Continue without microphone - we'll use data channel for text and can add tracks later if needed
        }
      }
      
      // Step 5: Create an offer and set local description
      console.log("[WebRTCConnectionEstablisher] Creating offer");
      const offer = await pc.createOffer();
      
      // Log SDP offer details - including checking for audio media section
      if (offer.sdp) {
        console.log("[WebRTCConnectionEstablisher] SDP offer created with length:", offer.sdp.length);
        
        // Check for audio media section in the SDP
        const hasAudioSection = offer.sdp.includes("m=audio");
        console.log("[WebRTCConnectionEstablisher] SDP contains audio media section:", hasAudioSection);
        
        if (hasAudioSection) {
          // Extract and log the audio media section for debugging
          const audioSectionMatch = offer.sdp.match(/m=audio.*(?:\r\n|\r|\n)(?:.*(?:\r\n|\r|\n))*/);
          if (audioSectionMatch) {
            console.log("[WebRTCConnectionEstablisher] Audio section details:", audioSectionMatch[0]);
          }
        } else {
          console.warn("[WebRTCConnectionEstablisher] WARNING: No audio media section found in SDP offer!");
        }
        
        // Log the first and last few lines of the SDP for debugging
        const sdpLines = offer.sdp.split("\n");
        const firstLines = sdpLines.slice(0, 5).join("\n");
        const lastLines = sdpLines.slice(-5).join("\n");
        console.log("[WebRTCConnectionEstablisher] SDP offer preview (first 5 lines):\n", firstLines);
        console.log("[WebRTCConnectionEstablisher] SDP offer preview (last 5 lines):\n", lastLines);
      } else {
        console.warn("[WebRTCConnectionEstablisher] SDP offer is empty!");
      }
      
      // Step 6: Set the local description on the peer connection
      // This applies the offer as the local description
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
      
      // Create a promise that resolves or rejects based on the connection state
      const connectionPromise = new Promise<void>((resolve, reject) => {
        const connectionTimeout = setTimeout(() => {
          reject(new Error("Remote description set but connection timed out"));
        }, 10000); // 10 second timeout for connection after setting remote description
        
        const connectionStateHandler = () => {
          if (pc.connectionState === "connected") {
            clearTimeout(connectionTimeout);
            pc.removeEventListener("connectionstatechange", connectionStateHandler);
            resolve();
          } else if (pc.connectionState === "failed" || pc.connectionState === "closed") {
            clearTimeout(connectionTimeout);
            pc.removeEventListener("connectionstatechange", connectionStateHandler);
            reject(new Error(`Connection failed with state: ${pc.connectionState}`));
          }
        };
        
        pc.addEventListener("connectionstatechange", connectionStateHandler);
      });
      
      try {
        // Step 8: Set remote description from OpenAI response
        console.log("[WebRTCConnectionEstablisher] Setting remote description");
        await pc.setRemoteDescription(result.answer);
        console.log("[WebRTCConnectionEstablisher] Remote description set successfully");
        
        try {
          // Step 9: Wait for the connection to be established
          console.log("[WebRTCConnectionEstablisher] Waiting for connection to be established");
          await connectionPromise;
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
