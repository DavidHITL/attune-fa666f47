
/**
 * Utility class for sending audio data and audio-related commands
 * via WebRTC data channel
 */
export class AudioSender {
  /**
   * Commits the current audio buffer to signal the end of an utterance
   * This tells OpenAI that the current audio segment is complete
   * @param dc The WebRTC data channel to use for sending
   * @returns Boolean indicating success
   */
  static commitAudioBuffer(dc: RTCDataChannel | null): boolean {
    if (!dc || dc.readyState !== "open") {
      console.error("[AudioSender] Data channel not open for committing audio buffer");
      return false;
    }
    
    try {
      // Send a simple commit event to notify the server
      // OpenAI needs this with server VAD to allow for manual end-of-utterance signals
      const commitEvent = {
        type: 'input_audio_buffer.commit',
      };
      
      dc.send(JSON.stringify(commitEvent));
      console.log("[AudioSender] Audio buffer commit signal sent");
      return true;
    } catch (error) {
      console.error("[AudioSender] Error sending audio buffer commit:", error);
      return false;
    }
  }

  // Remove the sendAudioData method as we're now using media tracks directly
  // and don't need to manually send audio chunks
}
