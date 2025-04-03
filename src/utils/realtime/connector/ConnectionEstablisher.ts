
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
      console.log("[ConnectionEstablisher] Starting connection establishment process");
      
      // Verify API key is present
      if (!apiKey || apiKey.trim() === '') {
        console.error("[ConnectionEstablisher] [ApiKeyError] Empty or invalid API key provided");
        callbacks.onError(new Error("No valid API key provided"));
        return null;
      }
      
      // Log key validity (first few chars only for security)
      console.log(`[ConnectionEstablisher] Using API key: ${apiKey.substring(0, 5)}..., length: ${apiKey.length}`);
      
      // Create and configure peer connection
      console.log("[ConnectionEstablisher] Creating RTCPeerConnection");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Add audio track to the connection if provided
      let stream: MediaStream | undefined;
      if (audioTrack) {
        console.log("[ConnectionEstablisher] [AudioTrack] Adding audio track to peer connection");
        try {
          stream = new MediaStream([audioTrack]);
          const sender = pc.addTrack(audioTrack, stream);
          console.log("[ConnectionEstablisher] [AudioTrack] Added audio track to peer connection:", 
            audioTrack ? `${audioTrack.label} (${audioTrack.id})` : "none");
          
          // Configure the audio sender for best quality
          console.log("[ConnectionEstablisher] [AudioTrack] Configuring audio sender parameters");
          const params = sender.getParameters();
          if (params.encodings) {
            params.encodings.forEach(encoding => {
              // Set priority to high for voice
              encoding.priority = 'high';
              
              // Set other properties that are available
              encoding.active = true;
              encoding.maxBitrate = 128000; // 128 kbps is good for voice quality
            });
            await sender.setParameters(params).catch(err => {
              console.warn("[ConnectionEstablisher] [AudioTrack] Failed to set sender parameters:", err);
              // Non-fatal error, continue without failing
            });
          }
          
          // Also add a transceiver with proper direction
          console.log("[ConnectionEstablisher] [AudioTrack] Adding audio transceiver");
          pc.addTransceiver('audio', { 
            direction: 'sendrecv',
            streams: [stream]
          });
        } catch (audioError) {
          console.error("[ConnectionEstablisher] [AudioTrackError] Error adding audio track:", audioError);
          // Continue without audio track rather than failing completely
        }
      } else {
        console.log("[ConnectionEstablisher] No audio track provided, proceeding without audio sending capability");
      }

      // Set up connection listeners
      console.log("[ConnectionEstablisher] Setting up peer connection listeners");
      setupPeerConnectionListeners(pc, options, callbacks.onConnectionStateChange);

      // Create data channel before generating offer
      console.log("[ConnectionEstablisher] Creating data channel");
      const dc = DataChannelCreator.createDataChannel(pc, "data", options, callbacks.onDataChannelOpen);
      if (!dc) {
        console.error("[ConnectionEstablisher] [DataChannelError] Failed to create data channel");
        throw new Error("Failed to create data channel");
      }

      // Create offer with audio codec preferences
      const offerOptions: RTCOfferOptions = {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      };
      
      console.log("[ConnectionEstablisher] [OfferCreation] Creating SDP offer with options:", offerOptions);
      let offer: RTCSessionDescriptionInit;
      try {
        offer = await pc.createOffer(offerOptions);
        console.log("[ConnectionEstablisher] [OfferCreation] Successfully created offer");
      } catch (offerError) {
        console.error("[ConnectionEstablisher] [OfferCreationError] Failed to create offer:", offerError);
        throw new Error(`Failed to create WebRTC offer: ${offerError.message}`);
      }

      // Set local description
      console.log("[ConnectionEstablisher] [LocalDescription] Setting local description");
      try {
        await pc.setLocalDescription(offer);
        console.log("[ConnectionEstablisher] [LocalDescription] Local description set successfully");
      } catch (sdpError) {
        console.error("[ConnectionEstablisher] [LocalDescriptionError] Failed to set local description:", sdpError);
        throw new Error(`Failed to set local description: ${sdpError.message}`);
      }
      
      if (!pc.localDescription || !pc.localDescription.sdp) {
        console.error("[ConnectionEstablisher] [LocalDescriptionError] No SDP in local description");
        throw new Error("Failed to set local description - no SDP available");
      }

      // Request the API endpoint with the SDP offer
      const endpoint = `https://api.openai.com/v1/realtime?model=${options.model}`;
      console.log(`[ConnectionEstablisher] [ApiRequest] Sending SDP offer to ${endpoint}`);
      console.log(`[ConnectionEstablisher] [ApiRequest] Using bearer token auth with key: ${apiKey.substring(0, 5)}...`);

      try {
        console.time("[ConnectionEstablisher] [ApiRequest] SDP exchange duration");
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/sdp"
          },
          body: pc.localDescription.sdp
        });
        console.timeEnd("[ConnectionEstablisher] [ApiRequest] SDP exchange duration");

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[ConnectionEstablisher] [ApiRequestError] API request failed with status ${response.status}:`, errorText);
          
          // Check specifically for auth errors
          if (response.status === 401 || response.status === 403 || errorText.includes("auth")) {
            throw new Error(`Authentication failed: ${response.status} - Please check your API key`);
          } else {
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
          }
        }

        // Get the SDP answer from the response
        const answerSdp = await response.text();
        console.log("[ConnectionEstablisher] [ApiRequest] Received SDP answer from API");

        if (!answerSdp || answerSdp.trim().length < 10) {
          console.error("[ConnectionEstablisher] [ApiRequestError] Received empty or invalid SDP answer");
          throw new Error("Received empty or invalid SDP answer from OpenAI");
        }

        // Create and set remote description
        const answerDesc = new RTCSessionDescription({
          type: "answer",
          sdp: answerSdp
        });

        console.log("[ConnectionEstablisher] [RemoteDescription] Setting remote description");
        await pc.setRemoteDescription(answerDesc);
        console.log("[ConnectionEstablisher] [RemoteDescription] Remote description set successfully");

      } catch (apiError) {
        console.error("[ConnectionEstablisher] [ApiRequestError] Error in API communication:", apiError);
        throw apiError;
      }

      console.log("[ConnectionEstablisher] Connection established successfully");
      return { pc, dc };
    } catch (error) {
      console.error("[ConnectionEstablisher] [ConnectionError] Error establishing connection:", error);
      console.error("[ConnectionEstablisher] [ConnectionError] Stack trace:", error?.stack);
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
