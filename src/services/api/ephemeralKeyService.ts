
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface EphemeralKeyResponse {
  client_secret: {
    value: string;
    expires_at: number; // Unix timestamp in seconds
  };
  session_id?: string;
  model?: string;
}

/**
 * Get an ephemeral OpenAI API key from Supabase Edge Function
 * @param options Optional parameters for session creation
 * @returns Promise with the ephemeral key
 */
export async function getEphemeralKey(options: {
  model?: string;
  voice?: string;
  instructions?: string;
} = {}): Promise<string> {
  try {
    console.log("[ephemeralKeyService] Requesting ephemeral key from Supabase");
    
    // Verify we have an authenticated session before making the request
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("[ephemeralKeyService] Session error:", sessionError);
      throw new Error(`Authentication error: ${sessionError.message}`);
    }
    
    if (!sessionData?.session) {
      console.error("[ephemeralKeyService] No active session found");
      throw new Error("No active authentication session found");
    }
    
    // Default parameters for the token request
    const params = {
      model: options.model || "gpt-4o-realtime-preview-2024-12-17",
      voice: options.voice || "alloy",
      instructions: options.instructions || "You are a helpful assistant. Be concise in your responses."
    };
    
    console.log("[ephemeralKeyService] Requesting token with params:", 
      JSON.stringify({
        model: params.model,
        voice: params.voice, 
        hasInstructions: !!params.instructions
      })
    );
    
    // Now make the request with the authenticated session
    const { data, error } = await supabase.functions.invoke('generate-ephemeral-key', {
      body: params
    });
    
    if (error) {
      console.error("[ephemeralKeyService] Error fetching ephemeral key:", error);
      throw new Error(`Failed to get ephemeral key: ${error.message}`);
    }
    
    if (!data || !data.client_secret?.value) {
      console.error("[ephemeralKeyService] Invalid response format:", data);
      throw new Error("Invalid ephemeral key response format");
    }
    
    // Validate token expiration (should be valid for at least 5 seconds)
    const expiresAt = data.client_secret.expires_at;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = expiresAt - currentTimestamp;
    
    if (timeUntilExpiration < 5) {
      console.error("[ephemeralKeyService] Token expiring too soon:", timeUntilExpiration);
      throw new Error(`Ephemeral key expiring too soon (${timeUntilExpiration}s)`);
    }
    
    console.log("[ephemeralKeyService] Successfully obtained ephemeral key, valid for", timeUntilExpiration, "seconds");
    return data.client_secret.value;
  } catch (error) {
    console.error("[ephemeralKeyService] Exception getting ephemeral key:", error);
    toast.error(`Authentication error: Please make sure you're signed in and try again.`);
    throw new Error(`Failed to get ephemeral key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to wrap API calls with secure OpenAI authentication
 * @param apiCallback Function that requires an API key
 * @returns Promise with the result of the API call
 */
export async function withSecureOpenAI<T>(
  apiCallback: (apiKey: string) => Promise<T>,
  options: {
    model?: string;
    voice?: string;
    instructions?: string;
  } = {}
): Promise<T> {
  try {
    console.log("[ephemeralKeyService] Starting secure OpenAI API call");
    const ephemeralKey = await getEphemeralKey(options);
    
    if (!ephemeralKey) {
      console.error("[ephemeralKeyService] No valid ephemeral key returned");
      throw new Error("Failed to get valid ephemeral key");
    }
    
    console.log("[ephemeralKeyService] Executing API callback with ephemeral key");
    return await apiCallback(ephemeralKey);
  } catch (error) {
    console.error("[ephemeralKeyService] Error in secure API call:", error);
    toast.error("Authentication failed. Please sign in again.");
    throw new Error(`Secure API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
