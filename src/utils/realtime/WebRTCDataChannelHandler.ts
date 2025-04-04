
import { WebRTCOptions } from "./WebRTCTypes";

/**
 * Set up event listeners for the data channel
 */
export function setupDataChannelListeners(
  dc: RTCDataChannel,
  options: WebRTCOptions,
  onOpen?: () => void
): void {
  console.log(`[WebRTC] [DataChannel] Setting up listeners for data channel: ${dc.label}, readyState: ${dc.readyState}`);
  
  // Set up timeout to monitor channel opening
  const channelOpenTimeout = setTimeout(() => {
    if (dc.readyState !== 'open') {
      console.error(`[WebRTC] [DataChannel] [ERROR] Data channel '${dc.label}' failed to open within timeout period (10 seconds)`);
      console.error(`[WebRTC] [DataChannel] [ERROR] Current readyState: ${dc.readyState}`);
      
      // Notify about the timeout issue if error handler is available
      if (options.onError) {
        options.onError(new Error(`Data channel '${dc.label}' failed to open within 10 second timeout period`));
      }
    }
  }, 10000); // 10 second timeout (increased from 5s)
  
  dc.onopen = () => {
    console.log(`[WebRTC] [DataChannel] Data channel '${dc.label}' opened, readyState: ${dc.readyState}`);
    clearTimeout(channelOpenTimeout);
    
    // Verify the channel is actually open before calling the callback
    if (dc.readyState === 'open') {
      // Call the onOpen callback if provided
      if (onOpen) {
        console.log(`[WebRTC] [DataChannel] Calling onOpen callback for data channel '${dc.label}'`);
        onOpen();
      }
    } else {
      console.warn(`[WebRTC] [DataChannel] [WARNING] Data channel reported open event but readyState is ${dc.readyState}`);
    }
  };
  
  dc.onclose = () => {
    console.log(`[WebRTC] [DataChannel] Data channel '${dc.label}' closed, readyState: ${dc.readyState}`);
    clearTimeout(channelOpenTimeout);
    
    // Only report unexpected closures as errors when the connection is still active
    if ((dc.readyState === 'closing' || dc.readyState === 'closed') && 
        (dc.label === 'oai-events' || dc.label === 'data')) {
      console.warn(`[WebRTC] [DataChannel] [WARNING] Data channel '${dc.label}' was closed unexpectedly`);
      
      if (options.onError) {
        options.onError(new Error(`Data channel '${dc.label}' closed unexpectedly`));
      }
    }
  };
  
  dc.onerror = (event) => {
    console.error(`[WebRTC] [DataChannel] [ERROR] Data channel '${dc.label}' error:`);
    clearTimeout(channelOpenTimeout);
    
    // Extract detailed error information if available
    if (event instanceof RTCErrorEvent) {
      console.error("[WebRTC] [DataChannel] [ERROR] Error details:", {
        errorType: event.error.errorDetail,
        message: event.error.message || "No message provided",
        receivedAlert: event.error.receivedAlert,
        sctpCauseCode: event.error.sctpCauseCode,
        sdpLineNumber: event.error.sdpLineNumber
      });
    } else {
      console.error("[WebRTC] [DataChannel] [ERROR] Error event:", event);
    }
    
    // Propagate the error
    if (options.onError) {
      options.onError(event instanceof RTCErrorEvent ? event.error : new Error("Data channel error"));
    }
  };
  
  dc.onmessage = (event) => {
    try {
      // Parse the message and log for debugging
      const message = JSON.parse(event.data);
      console.log(`[WebRTC] [DataChannel] Received message on '${dc.label}' channel:`, message.type || "unknown type");
      
      // Log specific message types in more detail
      if (message.type === 'input_audio_buffer.commit') {
        console.log("[WebRTC] [DataChannel] Voice activity detected end - Audio buffer committed");
      } else if (message.type === 'session.created') {
        console.log("[WebRTC] [DataChannel] Session created successfully:", message.session?.id);
      } else if (message.type === 'session.updated') {
        console.log("[WebRTC] [DataChannel] Session updated successfully");
      } else if (message.type === 'error') {
        console.error(`[WebRTC] [DataChannel] [ERROR] Received error from server: ${message.error?.message || "Unknown error"}`);
      }
      
      // Forward the message to the callback if provided
      if (options.onMessage) {
        options.onMessage(event);
      }
    } catch (error) {
      console.warn(`[WebRTC] [DataChannel] Could not parse message as JSON on '${dc.label}' channel:`, event.data);
      
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
    console.log(`[WebRTC] [DataChannel] Creating data channel: ${label}`);
    
    // Improved data channel options for reliability
    const dataChannelOptions: RTCDataChannelInit = {
      ordered: true,
      maxRetransmits: 10,  // Allow up to 10 retransmission attempts for reliability
    };
    
    const dc = pc.createDataChannel(label, dataChannelOptions);
    console.log(`[WebRTC] [DataChannel] Data channel created with id: ${dc.id}, initial readyState: ${dc.readyState}`);
    
    setupDataChannelListeners(dc, options, onOpen);
    
    // Check if the data channel is already open (rare but possible)
    if (dc.readyState === 'open' && onOpen) {
      console.log(`[WebRTC] [DataChannel] Data channel '${label}' already open, calling onOpen callback immediately`);
      onOpen();
    }
    
    return dc;
  } catch (error) {
    console.error(`[WebRTC] [DataChannel] [ERROR] Error creating data channel '${label}':`, error);
    console.error("[WebRTC] [DataChannel] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    throw error;
  }
}
