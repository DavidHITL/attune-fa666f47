
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
      console.error("[WebRTC] No SDP in local description");
      return {
        success: false,
        error: "No valid SDP in local description"
      };
    }
    
    // Connect to OpenAI's Realtime API with the WebRTC offer
    const baseUrl = "https://api.openai.com/v1/realtime";
    
    // Ensure model is properly URL encoded
    const modelParam = encodeURIComponent(model);
    const requestUrl = `${baseUrl}?model=${modelParam}`;
    
    console.log(`[WebRTC] Using model: ${model}`);
    console.log(`[WebRTC] Requesting from endpoint: ${requestUrl}`);
    
    const sdpResponse = await fetch(requestUrl, {
      method: "POST",
      body: localDescription.sdp,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/sdp"
      }
    });

    // Check for HTTP errors
    if (!sdpResponse.ok) {
      const errorText = await sdpResponse.text();
      console.error("[WebRTC] API Error Status:", sdpResponse.status);
      console.error("[WebRTC] API Error Response:", errorText);
      
      if (sdpResponse.status === 401) {
        return {
          success: false,
          error: `Authentication error: Invalid API key or unauthorized access`
        };
      }
      
      return {
        success: false,
        error: `API Error: ${sdpResponse.status} - ${errorText}`
      };
    }

    // Get the SDP answer from OpenAI
    const sdpAnswer = await sdpResponse.text();
    console.log("[WebRTC] Received SDP answer with length:", sdpAnswer.length);
    
    if (!sdpAnswer || sdpAnswer.trim() === "") {
      console.error("[WebRTC] Empty SDP answer received");
      return {
        success: false,
        error: "Empty SDP answer received from API"
      };
    }
    
    // Create and return the remote description
    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: sdpAnswer
    };
    
    console.log("[WebRTC] Successfully created answer from SDP");
    
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
