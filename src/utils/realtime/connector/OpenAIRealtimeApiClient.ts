
import { ApiResponseHandler } from './ApiResponseHandler';
import { OfferResult } from './types/OfferTypes';

/**
 * Client for OpenAI's Realtime API
 */
export class OpenAIRealtimeApiClient {
  private static baseUrl = "https://api.openai.com/v1/realtime";
  
  /**
   * Send WebRTC offer to OpenAI's Realtime API
   * @param localDescription WebRTC local SDP description 
   * @param apiKey Ephemeral API key for OpenAI authentication
   * @param model OpenAI model to use for the realtime session
   * @returns Promise with the result containing success status and answer SDP
   */
  static async sendOffer(
    localDescription: RTCSessionDescription,
    apiKey: string,
    model: string
  ): Promise<OfferResult> {
    console.log("[WebRTC] Sending offer to OpenAI Realtime API");
    
    if (!localDescription.sdp) {
      console.error("[WebRTC] No SDP in local description");
      return {
        success: false,
        error: "No valid SDP in local description"
      };
    }
    
    try {
      // Ensure model is properly URL encoded
      const modelParam = encodeURIComponent(model);
      const requestUrl = `${this.baseUrl}?model=${modelParam}`;
      
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
      
      // Send the SDP offer to OpenAI with the ephemeral token
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
        const errorMessage = await ApiResponseHandler.processErrorResponse(sdpResponse);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Get the SDP answer from OpenAI
      console.log("[WebRTC] Reading response body");
      const sdpAnswer = await sdpResponse.text();
      
      ApiResponseHandler.logSdpPreview(sdpAnswer, 'answer');
      
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
}
