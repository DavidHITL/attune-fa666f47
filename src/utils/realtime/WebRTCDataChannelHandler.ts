
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Set up event listeners for the data channel
 */
export function setupDataChannelListeners(
  dc: RTCDataChannel,
  options: WebRTCOptions,
  onOpen?: () => void
): void {
  console.log(`[WebRTC] Setting up listeners for data channel: ${dc.label}`);
  
  dc.onopen = () => {
    console.log(`[WebRTC] Data channel '${dc.label}' opened, readyState: ${dc.readyState}`);
    
    // Call the onOpen callback if provided
    if (onOpen) {
      console.log("[WebRTC] Calling onOpen callback");
      onOpen();
    }
  };
  
  dc.onclose = () => {
    console.log(`[WebRTC] Data channel '${dc.label}' closed, readyState: ${dc.readyState}`);
  };
  
  dc.onerror = (event) => {
    console.error(`[WebRTC] Data channel '${dc.label}' error:`);
    
    // Extract detailed error information if available
    if (event instanceof RTCErrorEvent) {
      console.error("[WebRTC] Error details:", {
        errorType: event.error.errorDetail,
        message: event.error.message || "No message provided",
        receivedAlert: event.error.receivedAlert,
        sctpCauseCode: event.error.sctpCauseCode,
        sdpLineNumber: event.error.sdpLineNumber
      });
    } else {
      console.error("[WebRTC] Error event:", event);
    }
  };
  
  dc.onmessage = (event) => {
    try {
      // Parse the message and log for debugging
      const message = JSON.parse(event.data);
      console.log(`[WebRTC] Received message on '${dc.label}' channel:`, message.type || "unknown type");
      
      // Log specific message types in more detail
      if (message.type === 'input_audio_buffer.commit') {
        console.log("[WebRTC] Voice activity detected end - Audio buffer committed");
      } else if (message.type === 'session.created') {
        console.log("[WebRTC] Session created successfully:", message.session?.id);
      }
      
      // Forward the message to the callback if provided
      if (options.onMessage) {
        options.onMessage(event);
      }
    } catch (error) {
      console.warn(`[WebRTC] Could not parse message as JSON on '${dc.label}' channel:`, event.data);
      
      // Try to forward the raw message anyway
      if (options.onMessage) {
        options.onMessage(event);
      }
    }
  };
}

/**
 * Create a data channel with the specified configuration
 */
export function createDataChannel(
  pc: RTCPeerConnection, 
  label: string = "data",
  options: WebRTCOptions,
  onOpen?: () => void
): RTCDataChannel {
  try {
    console.log(`[WebRTC] Creating data channel: ${label}`);
    
    const dataChannelOptions: RTCDataChannelInit = {
      ordered: true,
    };
    
    const dc = pc.createDataChannel(label, dataChannelOptions);
    setupDataChannelListeners(dc, options, onOpen);
    
    return dc;
  } catch (error) {
    console.error(`[WebRTC] Error creating data channel '${label}':`, error);
    throw error;
  }
}
