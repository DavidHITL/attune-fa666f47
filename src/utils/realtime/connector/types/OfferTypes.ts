
/**
 * Result of sending a WebRTC offer to OpenAI's Realtime API
 */
export interface OfferResult {
  success: boolean;
  answer?: RTCSessionDescriptionInit;
  error?: string;
}
