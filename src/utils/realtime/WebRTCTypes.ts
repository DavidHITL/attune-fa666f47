/**
 * Configuration options for WebRTC connection
 */
export interface WebRTCOptions {
  /**
   * API model to use
   */
  model?: string;

  /**
   * Voice for audio responses
   */
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

  /**
   * Instructions for the API
   */
  instructions?: string;

  /**
   * User ID for context enrichment
   */
  userId?: string;

  /**
   * Callback for messages received
   */
  onMessage?: (event: MessageEvent) => void;

  /**
   * Callback for track events
   */
  onTrack?: (event: RTCTrackEvent) => void;

  /**
   * Callback for connection state changes
   */
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  /**
   * Callback for errors
   */
  onError?: (error: any) => void;
}
