
import { supabase } from "@/integrations/supabase/client";
import { TokenResponse } from "../types/events";

/**
 * Service for handling API token operations
 */
export class TokenService {
  /**
   * Request a token from Supabase Edge Function
   */
  static async requestToken(
    instructions = "You are a helpful AI assistant.",
    voice = "alloy"
  ): Promise<TokenResponse> {
    console.log("[TokenService] Requesting token from Edge Function");
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-realtime-token', {
        body: {
          instructions,
          voice
        }
      });

      if (error) {
        console.error("[TokenService] Error from Edge Function:", error);
        throw new Error(`Token generation failed: ${error.message}`);
      }

      if (!data.success || !data.client_secret?.value) {
        console.error("[TokenService] Token generation failed:", data.error);
        throw new Error(data.error || "Failed to generate token");
      }

      console.log("[TokenService] Received token successfully");
      return data as TokenResponse;
      
    } catch (error) {
      console.error("[TokenService] Token request failed:", error);
      throw error;
    }
  }
}
