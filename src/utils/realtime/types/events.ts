
// Event type definitions for the realtime connection

export interface AudioDataEvent {
  type: 'audio';
  data: Float32Array;
}

export interface TranscriptEvent {
  type: 'transcript';
  text: string;
  isFinal: boolean;
}

export interface ConnectionStateEvent {
  type: 'connection';
  state: 'connecting' | 'connected' | 'disconnected' | 'failed';
  error?: Error;
}

export type RealtimeEvent = AudioDataEvent | TranscriptEvent | ConnectionStateEvent;

export interface TokenResponse {
  success: boolean;
  client_secret: {
    value: string;
    expires_at: string;
  };
  session_id: string;
  expires_at: string;
  error?: string;
}
