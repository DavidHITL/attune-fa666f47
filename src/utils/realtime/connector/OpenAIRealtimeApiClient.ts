
import { supabase } from "@/integrations/supabase/client";
import { ApiResponseHandler } from './ApiResponseHandler';
import { OfferResult } from './types/OfferTypes';

/**
 * Client for OpenAI's Realtime API
 */
export class OpenAIRealtimeApiClient {
  /**
   * Send WebRTC offer to OpenAI's Realtime API via Supabase Edge Function
   * to bypass CORS restrictions
   * 
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
    console.log("[WebRTC] Sending offer to OpenAI Realtime API via Edge Function");
    
    if (!localDescription.sdp) {
      console.error("[WebRTC] No SDP in local description");
      return {
        success: false,
        error: "No valid SDP in local description"
      };
    }
    
    try {
      // Ensure model is properly set
      const actualModel = model || "gpt-4o-realtime-preview-2024-12-17";
      console.log(`[WebRTC] Using model: ${actualModel}`);
      
      // Log the first and last 100 chars of the SDP for debugging
      const sdpPreview = localDescription.sdp.length > 200 
        ? `${localDescription.sdp.substring(0, 100)}...${localDescription.sdp.substring(localDescription.sdp.length - 100)}`
        : localDescription.sdp;
      console.log(`[WebRTC] SDP offer preview: ${sdpPreview}`);
      
      console.time("[WebRTC] SDP Exchange Request Time");
      
      // Make sure the API key is valid
      if (!apiKey || apiKey.trim() === '') {
        throw new Error("Invalid or empty API key");
      }

      // Instead of directly calling OpenAI API, use our Edge Function as a proxy
      const response = await supabase.functions.invoke('webrtc-sdp-exchange', {
        body: {
          sdp: localDescription.sdp,
          apiKey: apiKey,
          model: actualModel
        }
      });
      
      console.timeEnd("[WebRTC] SDP Exchange Request Time");
      console.log(`[WebRTC] Edge Function response status: ${response.status}`);
      
      // Check for errors from the Edge Function
      if (response.error) {
        console.error("[WebRTC] Edge Function error:", response.error);
        return {
          success: false,
          error: `Edge Function error: ${response.error.message || 'Unknown error'}`
        };
      }
      
      // The Edge Function returns the raw SDP answer as text
      const sdpAnswer = response.data;
      
      if (!sdpAnswer || typeof sdpAnswer !== 'string' || sdpAnswer.trim() === "") {
        console.error("[WebRTC] Empty or invalid SDP answer received from Edge Function");
        return {
          success: false,
          error: "Empty or invalid SDP answer received"
        };
      }
      
      ApiResponseHandler.logSdpPreview(sdpAnswer, 'answer');
      
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
