
export interface WebRTCOptions {
  onTrack?: (event: RTCTrackEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onError?: (error: Error) => void;
  model?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  instructions?: string;
}
