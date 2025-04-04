
/**
 * Manages sending messages through WebRTC data channel
 */
export class MessageManager {
  /**
   * Send a text message to OpenAI
   */
  sendTextMessage(
    dataChannel: RTCDataChannel | null, 
    text: string, 
    onError: (error: any) => void
  ): boolean {
    if (!dataChannel || dataChannel.readyState !== "open") {
      console.warn("[MessageManager] Cannot send text message: data channel not open");
      return false;
    }
    
    try {
      console.log("[MessageManager] Sending text message:", text);
      
      // Create message object
      const message = {
        type: "text",
        text
      };
      
      // Send as JSON string
      dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[MessageManager] Error sending text message:", error);
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
      console.warn("[MessageManager] Cannot commit audio buffer: data channel not open");
      return false;
    }
    
    try {
      console.log("[MessageManager] Committing audio buffer");
      
      // Create message object
      const message = {
        type: "audio_commit"
      };
      
      // Send as JSON string
      dataChannel.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[MessageManager] Error committing audio buffer:", error);
      onError(error);
      return false;
    }
  }
}
