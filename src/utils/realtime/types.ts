
// Types for the realtime chat implementation

export type TranscriptCallback = (text: string) => void;

// Interface for audio chunks in the queue
export interface AudioChunk {
  buffer: AudioBuffer;
}

// Session configuration type
export interface SessionConfig {
  event_id: string;
  type: string;
  session: {
    modalities: string[];
    instructions: string;
    voice: string;
    input_audio_format: string;
    output_audio_format: string;
    input_audio_transcription: {
      model: string;
    };
    turn_detection: {
      type: string;
      threshold: number;
      prefix_padding_ms: number;
      silence_duration_ms: number;
    };
    temperature: number;
    max_response_output_tokens: number;
  }
}

// WebSocket message event types
export interface WebSocketMessageEvent {
  type: string;
  delta?: string;
  error?: string;
}
