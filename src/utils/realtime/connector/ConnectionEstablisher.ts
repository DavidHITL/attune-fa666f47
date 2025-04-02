
// Import the existing code for ConnectionEstablisher
import { WebRTCOptions } from "../WebRTCTypes";
import { ConnectionCallbacks } from "./types/ConnectionTypes";
import { DataChannelCreator } from "./DataChannelCreator";
import { setupPeerConnectionListeners } from "../WebRTCConnectionListeners";

export class ConnectionEstablisher {
  /**
   * Establish a connection to OpenAI's Realtime API
   */
  async establish(
    apiKey: string,
    options: WebRTCOptions,
    callbacks: ConnectionCallbacks,
    audioTrack?: MediaStreamTrack
  ): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel } | null> {
    try {
      // Create and configure peer connection
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Add audio track to the connection if provided
      let stream: MediaStream | undefined;
      if (audioTrack) {
        stream = new MediaStream([audioTrack]);
        const sender = pc.addTrack(audioTrack, stream);
        console.log("[ConnectionEstablisher] Added audio track to peer connection:", 
          audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
        
        // Configure the audio sender for best quality
        const params = sender.getParameters();
        if (params.encodings) {
          params.encodings.forEach(encoding => {
            // Set priority to high for voice
            encoding.priority = 'high';
            
            // Remove the degradationPreference property as it's not in the TypeScript definition
            // Instead, set other properties that are available
            encoding.active = true;
            encoding.maxBitrate = 128000; // 128 kbps is good for voice quality
          });
          await sender.setParameters(params);
        }
        
        // Also add a transceiver with proper direction
        pc.addTransceiver('audio', { 
          direction: 'sendrecv',
          streams: [stream]
        });
      } else {
        console.log("[ConnectionEstablisher] No audio track provided, proceeding without audio sending capability");
      }

      // Set up connection listeners
      setupPeerConnectionListeners(pc, options, callbacks.onConnectionStateChange);

      // Create data channel before generating offer
      const dc = DataChannelCreator.createDataChannel(pc, "data", options, callbacks.onDataChannelOpen);
      if (!dc) {
        throw new Error("Failed to create data channel");
      }

      // Create offer with audio codec preferences
      const offerOptions: RTCOfferOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      };
      
      console.log("[ConnectionEstablisher] Creating SDP offer with options:", offerOptions);
      const offer = await pc.createOffer(offerOptions);

      // Set preferred audio codec if needed
      // This is commented out but could be enabled for specific codec preferences
      // offer.sdp = this.setPreferredAudioCodec(offer.sdp, 'opus');

      console.log("[ConnectionEstablisher] Setting local description");
      await pc.setLocalDescription(offer);
      
      if (!pc.localDescription || !pc.localDescription.sdp) {
        throw new Error("Failed to set local description");
      }

      // Request the API endpoint with the SDP offer
      const endpoint = `https://api.openai.com/v1/realtime?model=${options.model}`;
      console.log(`[ConnectionEstablisher] Sending SDP offer to ${endpoint}`);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/sdp"
        },
        body: pc.localDescription.sdp
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      // Get the SDP answer from the response
      const answerSdp = await response.text();
      console.log("[ConnectionEstablisher] Received SDP answer from API");

      // Create and set remote description
      const answerDesc = new RTCSessionDescription({
        type: "answer",
        sdp: answerSdp
      });

      console.log("[ConnectionEstablisher] Setting remote description");
      await pc.setRemoteDescription(answerDesc);
      console.log("[ConnectionEstablisher] Remote description set successfully");

      return { pc, dc };
    } catch (error) {
      console.error("[ConnectionEstablisher] Error establishing connection:", error);
      callbacks.onError(error);
      return null;
    }
  }

  /**
   * Set preferred audio codec (optional utility)
   */
  private setPreferredAudioCodec(sdp: string, codec: string): string {
    const lines = sdp.split('\n');
    const audioMLineIndex = lines.findIndex(line => line.startsWith('m=audio'));
    
    if (audioMLineIndex === -1) {
      return sdp;
    }
    
    // Find the codec PT
    const codecRegExp = new RegExp('a=rtpmap:(\\d+) ' + codec + '/');
    const codecIndex = lines.findIndex(line => codecRegExp.test(line));
    
    if (codecIndex === -1) {
      return sdp;
    }
    
    const codecPT = lines[codecIndex].match(codecRegExp)![1];
    
    // Move codec to top of payload types
    const mLine = lines[audioMLineIndex].split(' ');
    const payloadTypes = mLine.slice(3);
    
    if (!payloadTypes.includes(codecPT)) {
      return sdp;
    }
    
    payloadTypes.splice(payloadTypes.indexOf(codecPT), 1);
    payloadTypes.unshift(codecPT);
    
    mLine.splice(3, payloadTypes.length, ...payloadTypes);
    lines[audioMLineIndex] = mLine.join(' ');
    
    return lines.join('\n');
  }
}
