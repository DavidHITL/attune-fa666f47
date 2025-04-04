
/**
 * Handles sending messages through WebRTC data channel
 */
export class MessageSender {
  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(
    dataChannel: RTCDataChannel | null, 
    text: string, 
    onError: (error: any) => void
  ): boolean {
    if (!dataChannel || dataChannel.readyState !== "open") {
      console.warn("[MessageSender] Cannot send text message: data channel not open");
      return false;
    }
    
    try {
      console.log("[MessageSender] Sending text message:", text);
      
      // Create message object
      const message = {
        type: "text",
        text
      };
      
      // Send as JSON string
      dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[MessageSender] Error sending text message:", error);
      onError(error);
      return false;
    }
  }

  /**
   * Commit the audio buffer to signal end of speech
   */
  commitAudioBuffer(
    dataChannel: RTCDataChannel | null, 
    onError: (error: any) => void
  ): boolean {
    if (!dataChannel || dataChannel.readyState !== "open") {
      console.warn("[MessageSender] Cannot commit audio buffer: data channel not open");
      return false;
    }
    
    try {
      console.log("[MessageSender] Committing audio buffer");
      
      // Create message object
      const message = {
        type: "audio_commit"
      };
      
      // Send as JSON string
      dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[MessageSender] Error committing audio buffer:", error);
      onError(error);
      return false;
    }
  }
}
