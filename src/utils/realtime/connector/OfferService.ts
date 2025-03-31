
interface OfferResult {
  success: boolean;
  answer?: RTCSessionDescriptionInit;
  error?: string;
}

/**
 * Send WebRTC offer to OpenAI's Realtime API
 */
export async function sendOffer(
  localDescription: RTCSessionDescription,
  apiKey: string,
  model: string
): Promise<OfferResult> {
  try {
    console.log("[WebRTC] Sending offer to OpenAI Realtime API");
    
    if (!localDescription.sdp) {
      return {
        success: false,
        error: "No valid SDP in local description"
      };
    }
    
    // Connect to OpenAI's Realtime API with the WebRTC offer
    const baseUrl = "https://api.openai.com/v1/realtime";
    
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: localDescription.sdp,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/sdp"
      }
    });

    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error("[WebRTC] API Error:", errorText);
      return {
        success: false,
        error: `API Error: ${sdpResponse.status} - ${errorText}`
      };
    }

    // Get the SDP answer from OpenAI
    const sdpAnswer = await sdpResponse.text();
    
    // Create and return the remote description
    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: sdpAnswer
    };
    
    return {
      success: true,
      answer
    };
  } catch (error) {
    console.error("[WebRTC] Error sending offer:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
