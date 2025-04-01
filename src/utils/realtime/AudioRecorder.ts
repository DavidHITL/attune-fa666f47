
// Re-export the AudioRecorder from its new location for backward compatibility
import { AudioRecorder } from './audio/AudioRecorder';
import type { AudioRecorderOptions } from './audio/types';

// We're no longer using the onAudioData callback to send audio chunks
// The callback is now empty and just comments that we don't need to manually send audio data
// The WebRTC connection handles this directly through the media track

export { AudioRecorder };
export type { AudioRecorderOptions };
