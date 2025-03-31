
/**
 * Handles sending text messages through WebRTC data channel
 */
export class TextMessageSender {
  /**
   * Send a text message to OpenAI through the data channel
   */
  static sendTextMessage(dc: RTCDataChannel, text: string): boolean {
    if (dc.readyState !== "open") {
      console.error(`[TextMessageSender] Data channel not open, current state: ${dc.readyState}`);
      return false;
    }
  
    try {
      // Create and send a text message event
      const messageEvent = {
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
  
      dc.send(JSON.stringify(messageEvent));
      
      // Request a response from OpenAI
      dc.send(JSON.stringify({type: "response.create"}));
      return true;
    } catch (error) {
      console.error("[TextMessageSender] Error sending text message:", error);
      return false;
    }
  }
}
