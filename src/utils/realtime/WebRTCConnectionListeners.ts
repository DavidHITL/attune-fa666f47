
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Set up event listeners for the peer connection
 */
export function setupPeerConnectionListeners(
  pc: RTCPeerConnection, 
  options: WebRTCOptions,
  onStateChange: (state: RTCPeerConnectionState) => void
): void {
  // Track ICE connection state
  pc.oniceconnectionstatechange = () => {
    console.log("[WebRTC] ICE connection state changed:", pc.iceConnectionState);
    
    // Additional logging for ICE failure conditions
    if (pc.iceConnectionState === 'failed') {
      console.error("[WebRTC] ICE connection failed - check network configuration and firewall settings");
    } else if (pc.iceConnectionState === 'disconnected') {
      console.warn("[WebRTC] ICE connection disconnected - may reconnect automatically");
    }
  };
  
  // Track ICE gathering state
  pc.onicegatheringstatechange = () => {
    console.log("[WebRTC] ICE gathering state:", pc.iceGatheringState);
  };
  
  // Log ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("[WebRTC] New ICE candidate:", event.candidate.type, event.candidate.protocol, event.candidate.address);
    } else {
      console.log("[WebRTC] ICE candidate gathering complete");
    }
  };
  
  // Handle incoming tracks (audio)
  pc.ontrack = (event) => {
    console.log("[WebRTC] Received track:", event.track.kind, event.track.id);
    
    // Handle audio track from OpenAI for playback
    if (event.track.kind === 'audio' && event.streams && event.streams[0]) {
      console.log("[WebRTC] Setting up audio playback for incoming audio stream");
      
      // Create an audio element if it doesn't exist
      let audioElement = document.getElementById('openai-audio') as HTMLAudioElement;
      
      if (!audioElement) {
        console.log("[WebRTC] Creating new audio element for playback");
        audioElement = document.createElement('audio');
        audioElement.id = 'openai-audio';
        audioElement.autoplay = true;
        audioElement.style.display = 'none';
        document.body.appendChild(audioElement);
      }
      
      // Set the stream as the source for the audio element
      audioElement.srcObject = event.streams[0];
      
      // Start playback (modern browsers require user interaction before autoplay)
      audioElement.play()
        .then(() => console.log("[WebRTC] Audio playback started successfully"))
        .catch(err => console.error("[WebRTC] Audio playback failed:", err));
    }
    
    if (options.onTrack) {
      options.onTrack(event);
    }
  };
  
  // Handle incoming data channels
  pc.ondatachannel = (event) => {
    const channel = event.channel;
    console.log("[WebRTC] Received data channel:", channel.label);
    
    if (channel.label === "oai-events") {
      console.log("[WebRTC] Found oai-events channel");
      
      // Set up message handler for the events channel
      channel.onmessage = (e) => {
        console.log("[WebRTC] Event message:", e.data);
        
        // Pass the message to any registered callbacks but don't attempt to send anything back
        if (options.onMessage) {
          options.onMessage(e);
        }
      };
      
      // Track channel closing - log only, don't close the connection
      channel.onclose = () => {
        console.log("[WebRTC] oai-events channel closed");
        // We only log this event, not taking any action to close the connection
      };
      
      // Track channel errors - log only, don't close the connection
      channel.onerror = (error) => {
        console.error("[WebRTC] oai-events channel error:", error);
        // We only log errors, not taking any action to close the connection
      };
      
      // Track channel open state
      channel.onopen = () => {
        console.log("[WebRTC] oai-events channel opened");
      };
    }
  };
  
  // Handle connection state changes
  pc.onconnectionstatechange = () => {
    const connectionState = pc.connectionState;
    console.log("[WebRTC] Connection state changed:", connectionState);
    
    onStateChange(connectionState);
    
    if (options.onConnectionStateChange) {
      options.onConnectionStateChange(connectionState);
    }
    
    // Handle disconnection or failure
    if (connectionState === "disconnected" || connectionState === "failed") {
      console.warn("[WebRTC] Connection lost or failed");
      
      // Log extended diagnostic information
      console.log("[WebRTC] Connection diagnostic information:", {
        iceConnectionState: pc.iceConnectionState,
        iceGatheringState: pc.iceGatheringState,
        signalingState: pc.signalingState
      });
    }
  };
  
  // Signaling state changes
  pc.onsignalingstatechange = () => {
    console.log("[WebRTC] Signaling state changed:", pc.signalingState);
  };
}
