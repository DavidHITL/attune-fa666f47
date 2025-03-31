
/**
 * Utility class for handling API responses
 */
export class ApiResponseHandler {
  /**
   * Process API response and extract error information
   * @param response Response from the API
   * @returns Formatted error message
   */
  static async processErrorResponse(response: Response): Promise<string> {
    let errorMessage = `API Error: ${response.status}`;
    
    try {
      const errorText = await response.text();
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
    
    // Handle common status codes with more specific messages
    if (response.status === 401) {
      errorMessage = `Authentication error: Invalid API key or unauthorized access`;
    } else if (response.status === 403) {
      errorMessage = `Authorization error: Your API key doesn't have permission to use this endpoint`;
    } else if (response.status === 429) {
      errorMessage = `Rate limit exceeded: Please try again later`;
    }
    
    console.error("[WebRTC] API Error:", errorMessage);
    return errorMessage;
  }

  /**
   * Log preview of SDP content
   * @param sdp SDP content to preview
   * @param type Type of SDP (offer or answer)
   */
  static logSdpPreview(sdp: string, type: 'offer' | 'answer'): void {
    if (!sdp || sdp.trim() === "") {
      console.error(`[WebRTC] Empty SDP ${type} received`);
      return;
    }
    
    console.log(`[WebRTC] Received SDP ${type} with length:`, sdp.length);
    
    // Log preview of the SDP
    const preview = sdp.length > 200 
      ? `${sdp.substring(0, 100)}...${sdp.substring(sdp.length - 100)}`
      : sdp;
    console.log(`[WebRTC] SDP ${type} preview: ${preview}`);
  }
}
