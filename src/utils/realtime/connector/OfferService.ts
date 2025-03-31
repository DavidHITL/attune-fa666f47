
interface OfferResult {
  success: boolean;
  answer?: RTCSessionDescriptionInit;
  error?: string;
}

/**
 * Send WebRTC offer to OpenAI's Realtime API
 * @param localDescription WebRTC local SDP description 
 * @param apiKey Ephemeral API key for OpenAI authentication
 * @param model OpenAI model to use for the realtime session
 * @returns Promise with the result containing success status and answer SDP
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
    
    // Log the first and last 100 chars of the SDP for debugging
    const sdpPreview = localDescription.sdp.length > 200 
      ? `${localDescription.sdp.substring(0, 100)}...${localDescription.sdp.substring(localDescription.sdp.length - 100)}`
      : localDescription.sdp;
    console.log(`[WebRTC] SDP offer preview: ${sdpPreview}`);
    
    console.time("[WebRTC] SDP API Request Time");
    
    // Make sure the API key is valid
    if (!apiKey || apiKey.trim() === '') {
      throw new Error("Invalid or empty API key");
    }
    
    const sdpResponse = await fetch(requestUrl, {
      method: "POST",
      body: localDescription.sdp,
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/sdp"
      }
    });
    console.timeEnd("[WebRTC] SDP API Request Time");

    // Log response status for debugging
    console.log(`[WebRTC] SDP response status: ${sdpResponse.status}`);

    // Check for HTTP errors
    if (!sdpResponse.ok) {
      let errorMessage = `API Error: ${sdpResponse.status}`;
      
      try {
        const errorText = await sdpResponse.text();
        console.error("[WebRTC] API Error Response:", errorText);
        
        try {
          // Try to parse the error as JSON for more detail
          const errorJson = JSON.parse(errorText);
          console.error("[WebRTC] API Error Details:", errorJson);
          errorMessage += ` - ${errorJson.error?.message || errorText}`;
        } catch (e) {
          // Not JSON, use the text
          errorMessage += ` - ${errorText}`;
        }
      } catch (textError) {
        console.error("[WebRTC] Couldn't read error response text:", textError);
      }
      
      if (sdpResponse.status === 401) {
        errorMessage = `Authentication error: Invalid API key or unauthorized access`;
      } else if (sdpResponse.status === 403) {
        errorMessage = `Authorization error: Your API key doesn't have permission to use this endpoint`;
      } else if (sdpResponse.status === 429) {
        errorMessage = `Rate limit exceeded: Please try again later`;
      }
      
      console.error("[WebRTC] API Error:", errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }

    // Get the SDP answer from OpenAI
    console.log("[WebRTC] Reading response body");
    const sdpAnswer = await sdpResponse.text();
    console.log("[WebRTC] Received SDP answer with length:", sdpAnswer.length);
    
    if (!sdpAnswer || sdpAnswer.trim() === "") {
      console.error("[WebRTC] Empty SDP answer received");
      return {
        success: false,
        error: "Empty SDP answer received from API"
      };
    }
    
    // Log preview of the SDP answer
    const answerPreview = sdpAnswer.length > 200 
      ? `${sdpAnswer.substring(0, 100)}...${sdpAnswer.substring(sdpAnswer.length - 100)}`
      : sdpAnswer;
    console.log(`[WebRTC] SDP answer preview: ${answerPreview}`);
    
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
