
import { encodeAudioData } from "../WebRTCAudioEncoder";

/**
 * Handles sending audio data through WebRTC data channel
 */
export class AudioSender {
  /**
   * Send audio data to OpenAI
   */
  static sendAudioData(dc: RTCDataChannel, audioData: Float32Array): boolean {
    if (dc.readyState !== "open") {
      console.error(`[AudioSender] Data channel not open for audio, current state: ${dc.readyState}`);
      return false;
    }
    
    try {
      // Convert Float32Array to PCM16 format and encode as base64
      const encodedAudio = encodeAudioData(audioData);
      
      // Send the audio buffer
      dc.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: encodedAudio
      }));
      
      return true;
    } catch (error) {
      console.error("[AudioSender] Error sending audio data:", error);
      return false;
    }
  }
}
