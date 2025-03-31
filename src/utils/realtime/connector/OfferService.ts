
import { OpenAIRealtimeApiClient } from './OpenAIRealtimeApiClient';
import { OfferResult } from './types/OfferTypes';

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
  return OpenAIRealtimeApiClient.sendOffer(localDescription, apiKey, model);
}
