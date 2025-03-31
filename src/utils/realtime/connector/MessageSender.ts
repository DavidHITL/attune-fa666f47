
/**
 * Send a text message to OpenAI through the data channel
 */
export function sendTextMessage(dc: RTCDataChannel, text: string): boolean {
  if (dc.readyState !== "open") {
    console.error("[WebRTC] Data channel not ready, cannot send message. State:", dc.readyState);
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
    console.error("[WebRTC] Error sending text message:", error);
    return false;
  }
}

/**
 * Send audio data to OpenAI through the data channel
 */
export function sendAudioData(
  dc: RTCDataChannel, 
  audioData: Float32Array,
  encodeFunction: (data: Float32Array) => string
): boolean {
  if (dc.readyState !== "open") {
    console.error("[WebRTC] Data channel not ready, cannot send audio. State:", dc.readyState);
    return false;
  }

  try {
    // Encode the audio data to base64
    const encodedAudio = encodeFunction(audioData);
    
    // Send the audio buffer
    dc.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: encodedAudio
    }));
    
    return true;
  } catch (error) {
    console.error("[WebRTC] Error sending audio data:", error);
    return false;
  }
}
