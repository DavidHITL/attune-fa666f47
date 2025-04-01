
import { encodeAudioData } from "../WebRTCAudioEncoder";

/**
 * Handles sending audio data through WebRTC data channel
 */
export class AudioSender {
  /**
   * Send audio data to OpenAI
   * @param dc Data channel to send audio through
   * @param audioData Float32Array of audio samples
   * @returns Whether the send was successful
   */
  static sendAudioData(dc: RTCDataChannel, audioData: Float32Array): boolean {
    if (dc.readyState !== "open") {
      console.error(`[AudioSender] Data channel not open for audio, current state: ${dc.readyState}`);
      return false;
    }
    
    try {
      // Convert Float32Array to PCM16 format and encode as base64
      const encodedAudio = encodeAudioData(audioData);
      
      // Send the audio buffer in the format OpenAI expects
      // This must be a JSON object with type and audio fields
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
