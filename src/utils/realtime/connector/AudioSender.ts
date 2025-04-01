
/**
 * Utility class for sending audio data and audio-related commands
 * via WebRTC data channel
 */
export class AudioSender {
  // Track if audio has been sent since the last commit
  private static audioHasBeenSent: boolean = false;
  
  /**
   * Mark that audio has been sent
   * This should be called whenever audio data is sent to the data channel
   */
  static markAudioSent(): void {
    AudioSender.audioHasBeenSent = true;
    console.log("[AudioSender] Audio data marked as sent");
  }
  
  /**
   * Commits the current audio buffer to signal the end of an utterance
   * This tells OpenAI that the current audio segment is complete
   * @param dc The WebRTC data channel to use for sending
   * @param forceCommit If true, will commit even if no audio has been detected
   * @returns Boolean indicating success
   */
  static commitAudioBuffer(dc: RTCDataChannel | null, forceCommit: boolean = false): boolean {
    if (!dc || dc.readyState !== "open") {
      console.error("[AudioSender] Data channel not open for committing audio buffer", 
        dc ? `(state: ${dc.readyState})` : "(channel is null)");
      return false;
    }
    
    // Only send commit if audio has been flowing or if forced
    if (AudioSender.audioHasBeenSent || forceCommit) {
      try {
        // Send a simple commit event to notify the server
        // OpenAI needs this with server VAD to allow for manual end-of-utterance signals
        const commitEvent = {
          type: 'input_audio_buffer.commit',
        };
        
        dc.send(JSON.stringify(commitEvent));
        console.log("[AudioSender] Audio buffer commit signal sent", forceCommit ? "(forced)" : "(natural end detected)");
        
        // Reset the flag after committing
        AudioSender.audioHasBeenSent = false;
        return true;
      } catch (error) {
        console.error("[AudioSender] Error sending audio buffer commit:", error);
        return false;
      }
    } else {
      console.log("[AudioSender] Audio buffer commit skipped - no audio was detected");
      return false;
    }
  }

  // Reset the audio tracking state (useful for new connections)
  static resetAudioState(): void {
    AudioSender.audioHasBeenSent = false;
    console.log("[AudioSender] Audio state reset");
  }
}
