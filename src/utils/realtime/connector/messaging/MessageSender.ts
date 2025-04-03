
/**
 * Handles sending messages over WebRTC data channels
 */
export class MessageSender {
  /**
   * Send a text message over a data channel
   * @param dataChannel The data channel to send the message over
   * @param text The text to send
   * @param errorHandler Optional error handler function
   * @returns Whether the send was successful
   */
  sendTextMessage(
    dataChannel: RTCDataChannel | null, 
    text: string, 
    errorHandler?: (error: any) => void
  ): boolean {
    if (!dataChannel || dataChannel.readyState !== "open") {
      const error = new Error(`Data channel not ready for sending text, state: ${dataChannel?.readyState || 'null'}`);
      console.error("[MessageSender]", error.message);
      if (errorHandler) errorHandler(error);
      return false;
    }
    
    try {
      console.log("[MessageSender] Sending text message");
      const event = {
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text
            }
          ]
        }
      };
      
      dataChannel.send(JSON.stringify(event));
      dataChannel.send(JSON.stringify({ type: "response.create" }));
      console.log("[MessageSender] Text message sent successfully");
      return true;
    } catch (error) {
      console.error("[MessageSender] Error sending text message:", error);
      if (errorHandler) errorHandler(error);
      return false;
    }
  }

  /**
   * Commit the audio buffer over a data channel
   * @param dataChannel The data channel to send the commit over
   * @param errorHandler Optional error handler function
   * @returns Whether the commit was successful
   */
  commitAudioBuffer(
    dataChannel: RTCDataChannel | null, 
    errorHandler?: (error: any) => void
  ): boolean {
    if (!dataChannel || dataChannel.readyState !== "open") {
      const error = new Error(`Data channel not ready for committing audio, state: ${dataChannel?.readyState || 'null'}`);
      console.error("[MessageSender]", error.message);
      if (errorHandler) errorHandler(error);
      return false;
    }
    
    try {
      console.log("[MessageSender] Committing audio buffer");
      const event = {
        type: "input_audio_buffer.commit"
      };
      
      dataChannel.send(JSON.stringify(event));
      console.log("[MessageSender] Audio buffer committed successfully");
      return true;
    } catch (error) {
      console.error("[MessageSender] Error committing audio buffer:", error);
      if (errorHandler) errorHandler(error);
      return false;
    }
  }
}
