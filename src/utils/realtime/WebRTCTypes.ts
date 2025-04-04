
/**
 * Options for WebRTC connections to OpenAI Realtime API
 */
export interface WebRTCOptions {
  /** Model to use for the conversation */
  model?: string;
  
  /** Voice to use for the AI */
  voice?: string;
  
  /** System instructions for the AI */
  instructions?: string;
  
  /** User ID for context loading */
  userId?: string;
  
  /** Callback for message events */
  onMessage?: (event: MessageEvent) => void;
  
  /** Callback for connection state changes */
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  
  /** Callback for errors */
  onError?: (error: any) => void;
  
  /** Callback for track events */
  onTrack?: (event: RTCTrackEvent) => void;
}
