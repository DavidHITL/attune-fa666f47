
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
    console.log("[WebRTC] Received track:", event.track.kind, event.track.id, "- Ready state:", event.track.readyState);
    
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

      // Track events for the remote audio track
      event.track.onunmute = () => console.log("[WebRTC] Remote audio track unmuted - AI is speaking");
      event.track.onmute = () => console.log("[WebRTC] Remote audio track muted - AI stopped speaking");
      event.track.onended = () => {
        console.log("[WebRTC] Remote audio track ended");
        
        // Check if this was an unexpected ending
        if (pc.connectionState === 'connected' && pc.iceConnectionState === 'connected') {
          console.warn("[WebRTC] Remote audio track ended unexpectedly while connection is still active");
          
          // Notify about potential issue
          if (options.onError) {
            options.onError(new Error("Remote audio track ended unexpectedly"));
          }
          
          // If connection is active but track ended, consider it might need reconnection
          if (options.onConnectionStateChange) {
            // We don't change the actual connection state, but we signal a problem
            // that the application layer can handle
            options.onConnectionStateChange('disconnected');
          }
        }
      };
    }
    
    if (options.onTrack) {
      options.onTrack(event);
    }
  };
  
  // Handle incoming data channels with improved error handling and logging
  pc.ondatachannel = (event) => {
    const channel = event.channel;
    console.log("[WebRTC] Received data channel:", channel.label);
    
    // Special handling for the oai-events channel from OpenAI
    if (channel.label === "oai-events") {
      console.log("[WebRTC] Found oai-events channel - Setting up event handlers");
      
      // Set up message handler for the events channel
      channel.onmessage = (e) => {
        // Parse and log the message data
        try {
          const messageData = JSON.parse(e.data);
          console.log("[WebRTC] Event received:", messageData.type || "unknown type");
          
          // Log specific event types with more detail
          if (messageData.type === 'input_audio_buffer.commit') {
            console.log("[WebRTC] Voice activity detected end - Audio buffer committed");
          } else if (messageData.type === 'session.created') {
            console.log("[WebRTC] Session created successfully:", messageData.session?.id);
          } else if (messageData.type === 'response.created') {
            console.log("[WebRTC] AI response started");
          } else if (messageData.type === 'response.done') {
            console.log("[WebRTC] AI response completed");
          }
          
          // Pass the message to any registered callbacks but don't attempt to send anything back
          if (options.onMessage) {
            options.onMessage(e);
          }
        } catch (err) {
          console.warn("[WebRTC] Could not parse message as JSON:", e.data);
          console.log("[WebRTC] Raw event message:", e.data);
          
          // Still try to pass the raw message to callbacks
          if (options.onMessage) {
            options.onMessage(e);
          }
        }
      };
      
      // Track channel opening
      channel.onopen = () => {
        console.log("[WebRTC] oai-events channel opened and ready for communication");
      };
      
      // Track channel closing - now we handle unexpected closure
      channel.onclose = () => {
        console.warn("[WebRTC] oai-events channel closed");
        
        // Check if the data channel closed while the connection is still active
        if (pc.connectionState === 'connected') {
          console.error("[WebRTC] Data channel closed unexpectedly while connection is active");
          
          // Notify about this issue
          if (options.onError) {
            options.onError(new Error("Data channel closed unexpectedly"));
          }
          
          // Trigger connection state change to initiate recovery
          if (options.onConnectionStateChange && pc.connectionState === 'connected') {
            options.onConnectionStateChange('disconnected');
          }
        }
      };
      
      // Enhanced error handling - log detailed error information
      channel.onerror = (error) => {
        console.error("[WebRTC] oai-events channel error occurred");
        
        // Extract more details from RTCErrorEvent if available
        if (error instanceof RTCErrorEvent) {
          console.error("[WebRTC] Error details:", {
            errorType: error.error.errorDetail,
            message: error.error.message || "No message provided",
            receivedAlert: error.error.receivedAlert,
            sctpCauseCode: error.error.sctpCauseCode,
            sdpLineNumber: error.error.sdpLineNumber
          });
        } else {
          // Log generic error
          console.error("[WebRTC] Error object:", error);
        }
        
        // Propagate the error to the error handler
        if (options.onError) {
          options.onError(error instanceof RTCErrorEvent ? error.error : error);
        }
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
