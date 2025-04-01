
/**
 * Handles sending audio data through WebRTC data channel
 * NOTE: This class is now mostly deprecated as we now use direct WebRTC audio track
 * instead of sending audio data through the data channel. It's kept for compatibility
 * and for the commitAudioBuffer functionality, which is still useful.
 */
export class AudioSender {
  private static lastAudioSentTimestamp = 0;
  private static audioChunkCounter = 0;
  
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
