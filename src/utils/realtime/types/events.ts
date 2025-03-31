
/**
 * Types of events emitted by the realtime system
 */

export interface AudioDataEvent {
  type: 'audio';
  data: Float32Array;
}

export interface TranscriptEvent {
  type: 'transcript';
  text: string;
  isFinal?: boolean;  // Added isFinal as an optional property
}

export interface ConnectionStateEvent {
  type: 'connection';
  state: 'connecting' | 'connected' | 'disconnected' | 'failed';
  error?: Error;
}

export type RealtimeEvent = AudioDataEvent | TranscriptEvent | ConnectionStateEvent;

export interface TokenResponse {
  client_id: string;
  client_secret: {
    value: string;
    expires_at: number;
  };
}
