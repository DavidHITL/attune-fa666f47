
import { encodeAudioData } from "../WebRTCAudioEncoder";

/**
 * Handles sending audio data through WebRTC data channel
 */
export class AudioSender {
  private static lastAudioSentTimestamp = 0;
  private static audioChunkCounter = 0;
  
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
      
      // Update stats
      const now = Date.now();
      this.audioChunkCounter++;
      
      // Log stats every 50 chunks or 5 seconds
      if (this.audioChunkCounter % 50 === 0 || now - this.lastAudioSentTimestamp > 5000) {
        console.log(`[AudioSender] Sent ${this.audioChunkCounter} audio chunks since last log`);
        this.audioChunkCounter = 0;
        this.lastAudioSentTimestamp = now;
      }
      
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

  /**
   * Send commit event to indicate the end of an audio segment
   * This tells OpenAI that the current utterance is complete
   * @param dc Data channel to send the commit through
   * @returns Whether the commit was successful
   */
  static commitAudioBuffer(dc: RTCDataChannel): boolean {
    if (dc.readyState !== "open") {
      console.error(`[AudioSender] Data channel not open for audio commit, current state: ${dc.readyState}`);
      return false;
    }
    
    try {
      console.log("[AudioSender] Committing audio buffer, signaling end of user speech");
      
      // Send the commit event
      dc.send(JSON.stringify({
        type: 'input_audio_buffer.commit'
      }));
      
      // Reset chunk counter after commit
      this.audioChunkCounter = 0;
      
      return true;
    } catch (error) {
      console.error("[AudioSender] Error committing audio buffer:", error);
      return false;
    }
  }
}
