
import { WebRTCOptions } from "../WebRTCTypes";
import { PeerConnectionFactory } from "./PeerConnectionFactory";
import { OfferService } from "./OfferService";
import { DataChannelCreator } from "./DataChannelCreator";
import { AudioSender } from "./AudioSender";
import { ConnectionCallbacks } from "./types/ConnectionTypes";

/**
 * Handles the establishment of WebRTC connections to OpenAI
 */
export class ConnectionEstablisher {
  /**
   * Establish a WebRTC connection to OpenAI
   * @param apiKey OpenAI API key
   * @param options WebRTC options
   * @param callbacks Connection lifecycle callbacks
   * @param audioTrack Optional MediaStreamTrack to add to the peer connection
   */
  async establish(
    apiKey: string,
    options: WebRTCOptions,
    callbacks: ConnectionCallbacks,
    audioTrack?: MediaStreamTrack
  ): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel } | null> {
    try {
      console.log("[ConnectionEstablisher] Starting connection process");
      
      // 1. Create Peer Connection
      const pc = PeerConnectionFactory.createPeerConnectionWithListeners(
        options,
        callbacks.onConnectionStateChange
      );
      
      // 2. Add the audio track from microphone to the peer connection
      let usedAudioTrack = audioTrack;
      
      // If no audio track was provided, try to get one directly
      if (!usedAudioTrack) {
        console.log("[ConnectionEstablisher] No audio track provided, attempting to get one");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 24000 // Setting recommended sample rate for OpenAI
            } 
          });
          usedAudioTrack = stream.getAudioTracks()[0];
          console.log("[ConnectionEstablisher] Successfully acquired microphone track:", 
            usedAudioTrack.label || "Unnamed track", 
            "- ID:", usedAudioTrack.id);
        } catch (err) {
          console.warn("[ConnectionEstablisher] Could not access microphone:", err);
          // Continue without audio track - we can still use data channel for text
        }
      }
      
      // Add the audio track if we have one (either provided or acquired)
      if (usedAudioTrack) {
        console.log("[ConnectionEstablisher] Adding audio track to peer connection:", 
          usedAudioTrack.label || "Unnamed track", 
          "- Enabled:", usedAudioTrack.enabled, 
          "- ID:", usedAudioTrack.id);
        
        // Reset the audio state before adding the track
        AudioSender.resetAudioState();
        
        // Create a new MediaStream with the track
        const mediaStream = new MediaStream([usedAudioTrack]);
        
        // Add the track to the peer connection
        const sender = pc.addTrack(usedAudioTrack, mediaStream);
        console.log("[ConnectionEstablisher] Audio track added to peer connection with sender ID:", 
          sender.track?.id || "unknown");
          
        // Use transceiver to set direction if needed
        const transceivers = pc.getTransceivers();
        const audioTransceiver = transceivers.find(t => t.sender === sender);
        if (audioTransceiver) {
          audioTransceiver.direction = "sendrecv"; // Allow bi-directional audio
          console.log("[ConnectionEstablisher] Audio transceiver direction set to:", audioTransceiver.direction);
        }
      } else {
        console.log("[ConnectionEstablisher] No audio track available, continuing without audio input");
      }

      // 3. Create Data Channel
      const dc = DataChannelCreator.createDataChannel(pc, "data", options, callbacks.onDataChannelOpen);
      if (!dc) {
        console.error("[ConnectionEstablisher] Failed to create data channel");
        this.cleanup(pc, dc);
        return null;
      }

      // 4. Create offer
      console.log("[ConnectionEstablisher] Creating offer");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[ConnectionEstablisher] Local description set");

      // 5. Send the offer to OpenAI and get answer
      const offerResult = await OfferService.sendOffer(
        pc.localDescription as RTCSessionDescription,
        apiKey,
        options?.model || "gpt-4o-realtime-preview-2024-12-17"
      );
      
      if (!offerResult.success || !offerResult.answer) {
        console.error("[ConnectionEstablisher] Failed to get answer SDP:", offerResult.error);
        callbacks.onError?.(new Error(offerResult.error || "Failed to get answer SDP"));
        this.cleanup(pc, dc);
        return null;
      }
      
      // 6. Set Remote Description from the answer
      await pc.setRemoteDescription(offerResult.answer);
      console.log("[ConnectionEstablisher] Remote description set");
      
      console.log("[ConnectionEstablisher] WebRTC connection established successfully");
      return { pc, dc };
    } catch (error) {
      console.error("[ConnectionEstablisher] Error during connection establishment:", error);
      callbacks.onError?.(error);
      return null;
    }
  }

  /**
   * Clean up connection resources
   */
  cleanup(pc: RTCPeerConnection | null, dc: RTCDataChannel | null): void {
    if (dc) {
      dc.close();
    }

    if (pc) {
      pc.close();
    }
  }
}
