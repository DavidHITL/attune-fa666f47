
import { WebRTCOptions } from "../WebRTCTypes";
import { SDPParser } from "../SDPParser"; 
import { AudioSender } from './AudioSender';

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

      // 2. Add Transceiver for Audio if audioTrack is provided
      if (audioTrack) {
        console.log("[WebRTCConnectionEstablisher] Adding audio track to peer connection:", 
          audioTrack.label || "Unnamed track", 
          "- Enabled:", audioTrack.enabled, 
          "- ID:", audioTrack.id);
        
        // Reset the audio state before adding the track
        AudioSender.resetAudioState();
        
        // Add the audio track and create a transceiver with sendonly direction
        const sender = (this.pc as RTCPeerConnectionWithNewTracks).addTrack(audioTrack, new MediaStream([audioTrack]));
        
        // Use addTransceiver method to set direction instead of directly setting it on the sender
        const transceivers = this.pc.getTransceivers();
        const audioTransceiver = transceivers.find(t => t.sender === sender);
        if (audioTransceiver) {
          audioTransceiver.direction = "sendonly";
          console.log("[WebRTCConnectionEstablisher] Audio transceiver direction set to:", audioTransceiver.direction);
        } else {
          console.warn("[WebRTCConnectionEstablisher] Could not find audio transceiver");
        }
      }

      // 3. Create Data Channel
      this.dc = this.createDataChannel(this.pc);
      if (!this.dc) {
        console.error("[WebRTCConnectionEstablisher] Failed to create data channel");
        this.closeConnection();
        return null;
      }

      // 4. Get Offer SDP from OpenAI
      const offer = await this.getOfferSDP(apiKey);
      if (!offer) {
        console.error("[WebRTCConnectionEstablisher] Failed to get offer SDP");
        this.closeConnection();
        return null;
      }

      // 5. Set Remote Description
      await this.pc.setRemoteDescription({ type: "offer", sdp: offer });
      console.log("[WebRTCConnectionEstablisher] Remote description set");

      // 6. Create and Set Answer
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      console.log("[WebRTCConnectionEstablisher] Local description set");

      // 7. Send Answer SDP to OpenAI
      const answerToSend = this.pc.localDescription?.sdp;
      if (!answerToSend) {
        console.error("[WebRTCConnectionEstablisher] Failed to get local description");
        this.closeConnection();
        return null;
      }

      const iceCandidates = await this.sendAnswerSDP(apiKey, answerToSend);
      if (!iceCandidates) {
        console.error("[WebRTCConnectionEstablisher] Failed to send answer SDP");
        this.closeConnection();
        return null;
      }

      // 8. Add ICE Candidates
      iceCandidates.forEach((candidate) => {
        this.pc?.addIceCandidate(candidate);
      });
      console.log("[WebRTCConnectionEstablisher] ICE candidates added");

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
   * Get the offer SDP from OpenAI
   * @param apiKey OpenAI API key
   */
  private async getOfferSDP(apiKey: string): Promise<string | null> {
    try {
      const response = await fetch("https://api.openai.com/v1/audio/realtime/webrtc/offer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: this.options?.model,
          voice: this.options?.voice,
        }),
      });

      if (!response.ok) {
        console.error(`[WebRTCConnectionEstablisher] Failed to get offer SDP, status: ${response.status}`);
        this.onError?.(new Error(`Failed to get offer SDP, status: ${response.status}`));
        return null;
      }

      const data = await response.json();
      const offer = data.sdp;

      if (!offer) {
        console.error("[WebRTCConnectionEstablisher] Offer SDP is empty");
        this.onError?.(new Error("Offer SDP is empty"));
        return null;
      }

      return offer;
    } catch (error) {
      console.error("[WebRTCConnectionEstablisher] Error getting offer SDP:", error);
      this.onError?.(error);
      return null;
    }
  }

  /**
   * Send the answer SDP to OpenAI
   * @param apiKey OpenAI API key
   * @param answerSDP Answer SDP
   */
  private async sendAnswerSDP(apiKey: string, answerSDP: string): Promise<RTCIceCandidate[] | null> {
    try {
      const sdpObject = this.sdpParser.parseSDP(answerSDP);
      const midValue = this.sdpParser.getMidValue(sdpObject);

      const response = await fetch("https://api.openai.com/v1/audio/realtime/webrtc/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          sdp: answerSDP,
          mid: midValue,
        }),
      });

      if (!response.ok) {
        console.error(`[WebRTCConnectionEstablisher] Failed to send answer SDP, status: ${response.status}`);
        this.onError?.(new Error(`Failed to send answer SDP, status: ${response.status}`));
        return null;
      }

      const data = await response.json();
      const iceCandidates = data.ice_candidates;

      if (!iceCandidates) {
        console.error("[WebRTCConnectionEstablisher] ICE candidates are empty");
        this.onError?.(new Error("ICE candidates are empty"));
        return null;
      }

      return iceCandidates;
    } catch (error) {
      console.error("[WebRTCConnectionEstablisher] Error sending answer SDP:", error);
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
