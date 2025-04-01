
/**
 * Helper class for processing API responses
 */
export class ApiResponseHandler {
  /**
   * Process an error response from the API
   * @param response HTTP response object
   * @returns Error message
   */
  static async processErrorResponse(response: Response): Promise<string> {
    try {
      // Try to parse as JSON first
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const errorJson = await response.json();
        console.error("[ApiResponseHandler] API error response:", errorJson);
        
        // Extract the error message from the JSON
        const errorMessage = 
          errorJson.error?.message || 
          errorJson.message || 
          errorJson.error || 
          `API error: ${response.status} ${response.statusText}`;
        
        return errorMessage;
      } else {
        // If not JSON, just get the text
        const errorText = await response.text();
        console.error(`[ApiResponseHandler] API error (${response.status}):`, errorText);
        return `API error (${response.status}): ${errorText.substring(0, 100)}`;
      }
    } catch (e) {
      // If we can't parse the response, return a generic error
      console.error(`[ApiResponseHandler] Failed to process error response: ${e}`);
      return `API error: ${response.status} ${response.statusText}`;
    }
  }

  /**
   * Log a preview of the SDP for debugging purposes
   * @param sdp The SDP string to preview
   * @param type The type of SDP (offer or answer)
   */
  static logSdpPreview(sdp: string, type: 'offer' | 'answer'): void {
    if (!sdp) {
      console.warn(`[ApiResponseHandler] Empty SDP ${type}`);
      return;
    }
    
    // Log the first and last 100 chars of the SDP
    const sdpPreview = sdp.length > 200 
      ? `${sdp.substring(0, 100)}...${sdp.substring(sdp.length - 100)}`
      : sdp;
    
    console.log(`[ApiResponseHandler] SDP ${type} preview:`, sdpPreview);
  }
}
