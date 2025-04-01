import { WebRTCOptions } from "../WebRTCTypes";
import { SDPParser } from "../SDPParser"; 
import { AudioSender } from './AudioSender';
import { AudioTrackManager } from './AudioTrackManager';
import { OpenAIRealtimeApiClient } from './OpenAIRealtimeApiClient';

interface RTCPeerConnectionWithNewTracks extends RTCPeerConnection {
  addTrack(track: MediaStreamTrack, stream: MediaStream): RTCRtpSender;
}

export class WebRTCConnectionEstablisher {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private sdpParser: SDPParser = new SDPParser();
  private options: WebRTCOptions | null = null;
  private onConnectionStateChange: ((state: RTCPeerConnectionState) => void) | null = null;
  private onDataChannelOpen: (() => void) | null = null;
  private onError: ((error: any) => void) | null = null;

  /**
   * Establish a WebRTC connection to OpenAI
   * @param apiKey OpenAI API key
   * @param options WebRTC options
   * @param onConnectionStateChange Callback for connection state changes
   * @param onDataChannelOpen Callback for data channel open event
   * @param onError Callback for errors
   * @param audioTrack Optional MediaStreamTrack to add to the peer connection
   */
  async establish(
    apiKey: string,
    options: WebRTCOptions,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void,
    onDataChannelOpen: () => void,
    onError: (error: any) => void,
    audioTrack?: MediaStreamTrack
  ): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel } | null> {
    this.options = options;
    this.onConnectionStateChange = onConnectionStateChange;
    this.onDataChannelOpen = onDataChannelOpen;
    this.onError = onError;

    try {
      // 1. Create Peer Connection
      this.pc = this.createPeerConnection();
      if (!this.pc) {
        console.error("[WebRTCConnectionEstablisher] Failed to create peer connection");
        return null;
      }

      // 2. Add the audio track from microphone to the peer connection
      let usedAudioTrack = audioTrack;
      
      // If no audio track was provided, try to get one directly
      if (!usedAudioTrack) {
        console.log("[WebRTCConnectionEstablisher] No audio track provided, attempting to get one");
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
          console.log("[WebRTCConnectionEstablisher] Successfully acquired microphone track:", 
            usedAudioTrack.label || "Unnamed track", 
            "- ID:", usedAudioTrack.id);
        } catch (err) {
          console.warn("[WebRTCConnectionEstablisher] Could not access microphone:", err);
          // Continue without audio track - we can still use data channel for text
        }
      }
      
      // Add the audio track if we have one (either provided or acquired)
      if (usedAudioTrack) {
        console.log("[WebRTCConnectionEstablisher] Adding audio track to peer connection:", 
          usedAudioTrack.label || "Unnamed track", 
          "- Enabled:", usedAudioTrack.enabled, 
          "- ID:", usedAudioTrack.id);
        
        // Reset the audio state before adding the track
        AudioSender.resetAudioState();
        
        // Create a new MediaStream with the track
        const mediaStream = new MediaStream([usedAudioTrack]);
        
        // Add the track to the peer connection
        const sender = this.pc.addTrack(usedAudioTrack, mediaStream);
        console.log("[WebRTCConnectionEstablisher] Audio track added to peer connection with sender ID:", 
          sender.track?.id || "unknown");
          
        // Use transceiver to set direction if needed
        const transceivers = this.pc.getTransceivers();
        const audioTransceiver = transceivers.find(t => t.sender === sender);
        if (audioTransceiver) {
          audioTransceiver.direction = "sendrecv"; // Allow bi-directional audio
          console.log("[WebRTCConnectionEstablisher] Audio transceiver direction set to:", audioTransceiver.direction);
        }
      } else {
        console.log("[WebRTCConnectionEstablisher] No audio track available, continuing without audio input");
      }

      // 3. Create Data Channel
      this.dc = this.createDataChannel(this.pc);
      if (!this.dc) {
        console.error("[WebRTCConnectionEstablisher] Failed to create data channel");
        this.closeConnection();
        return null;
      }

      // 4. Create offer
      console.log("[WebRTCConnectionEstablisher] Creating offer");
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);
      console.log("[WebRTCConnectionEstablisher] Local description set");

      // 5. Send the offer to OpenAI and get answer
      const offerResult = await OpenAIRealtimeApiClient.sendOffer(
        this.pc.localDescription as RTCSessionDescription,
        apiKey,
        this.options?.model || "gpt-4o-realtime-preview-2024-12-17"
      );
      
      if (!offerResult.success || !offerResult.answer) {
        console.error("[WebRTCConnectionEstablisher] Failed to get answer SDP:", offerResult.error);
        this.onError?.(new Error(offerResult.error || "Failed to get answer SDP"));
        this.closeConnection();
        return null;
      }
      
      // 6. Set Remote Description from the answer
      await this.pc.setRemoteDescription(offerResult.answer);
      console.log("[WebRTCConnectionEstablisher] Remote description set");
      
      console.log("[WebRTCConnectionEstablisher] WebRTC connection established successfully");
      return { pc: this.pc, dc: this.dc };
    } catch (error) {
      console.error("[WebRTCConnectionEstablisher] Error during connection establishment:", error);
      this.closeConnection();
      this.onError?.(error);
      return null;
    }
  }

  /**
   * Create a new RTCPeerConnection
   */
  private createPeerConnection(): RTCPeerConnection | null {
    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
        ],
      });

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTCConnectionEstablisher] ICE connection state changed to: ${pc.iceConnectionState}`);
      };

      pc.onconnectionstatechange = () => {
        console.log(`[WebRTCConnectionEstablisher] Peer connection state changed to: ${pc.connectionState}`);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(pc.connectionState);
        }
      };

      pc.onicegatheringstatechange = () => {
        console.log(`[WebRTCConnectionEstablisher] ICE gathering state changed to: ${pc.iceGatheringState}`);
      };

      pc.onsignalingstatechange = () => {
        console.log(`[WebRTCConnectionEstablisher] Signaling state changed to: ${pc.signalingState}`);
      };

      return pc;
    } catch (error) {
      console.error("[WebRTCConnectionEstablisher] Error creating peer connection:", error);
      this.onError?.(error);
      return null;
    }
  }

  /**
   * Create a new RTCDataChannel
   * @param pc RTCPeerConnection to create the data channel on
   */
  private createDataChannel(pc: RTCPeerConnection): RTCDataChannel | null {
    try {
      const dc = pc.createDataChannel("data", {
        ordered: true,
        negotiated: false,
      });

      dc.onopen = () => {
        console.log("[WebRTCConnectionEstablisher] Data channel is now open");
        this.onDataChannelOpen?.();
      };

      dc.onclose = () => {
        console.log("[WebRTCConnectionEstablisher] Data channel is now closed");
      };

      dc.onerror = (error) => {
        console.error("[WebRTCConnectionEstablisher] Data channel error:", error);
        this.onError?.(error);
      };

      dc.onmessage = (event) => {
        console.log("[WebRTCConnectionEstablisher] Received message:", event.data);
      };

      return dc;
    } catch (error) {
      console.error("[WebRTCConnectionEstablisher] Error creating data channel:", error);
      this.onError?.(error);
      return null;
    }
  }

  /**
   * Close the connection
   */
  private closeConnection(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }

    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.closeConnection();
    this.onConnectionStateChange = null;
    this.onDataChannelOpen = null;
    this.onError = null;
  }
}
