
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
    
    // Still proceed even if there's no authenticated session
    // This allows anonymous sessions to work
    if (sessionError) {
      console.warn("[ephemeralKeyService] Auth session warning (proceeding anyway):", sessionError);
    }
    
    if (!sessionData?.session) {
      console.warn("[ephemeralKeyService] No active session found, proceeding with anonymous access");
    } else {
      console.log("[ephemeralKeyService] User authenticated:", 
        sessionData.session.user?.id ? 
        `${sessionData.session.user.id.substring(0, 8)}...` : 
        "unknown user");
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
        hasInstructions: !!params.instructions,
        isAuthenticated: !!sessionData?.session
      })
    );
    
    console.time("[ephemeralKeyService] Token request duration");
    
    // Now make the request, with or without an authenticated session
    const { data, error } = await supabase.functions.invoke('generate-ephemeral-key', {
      body: params
    });
    
    console.timeEnd("[ephemeralKeyService] Token request duration");
    
    if (error) {
      console.error("[ephemeralKeyService] [TokenFetchError] Error fetching ephemeral key:", error);
      throw new Error(`Failed to get ephemeral key: ${error.message}`);
    }
    
    if (!data || !data.client_secret?.value) {
      console.error("[ephemeralKeyService] [TokenFetchError] Invalid response format:", data);
      throw new Error("Invalid ephemeral key response format");
    }
    
    // Validate token expiration (should be valid for at least 5 seconds)
    const expiresAt = data.client_secret.expires_at;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = expiresAt - currentTimestamp;
    
    if (timeUntilExpiration < 5) {
      console.error("[ephemeralKeyService] [TokenFetchError] Token expiring too soon:", timeUntilExpiration);
      throw new Error(`Ephemeral key expiring too soon (${timeUntilExpiration}s)`);
    }
    
    // Log the token preview (first few characters) for debugging
    console.log(`[ephemeralKeyService] Successfully obtained ephemeral key: ${data.client_secret.value.substring(0, 8)}..., valid for ${timeUntilExpiration} seconds`);
    return data.client_secret.value;
  } catch (error) {
    console.error("[ephemeralKeyService] [TokenFetchError] Exception getting ephemeral key:", error);
    toast.error(`Connection error: Please try again in a moment.`);
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
      console.error("[ephemeralKeyService] [TokenFetchError] No valid ephemeral key returned");
      throw new Error("Failed to get valid ephemeral key");
    }
    
    console.log("[ephemeralKeyService] Executing API callback with ephemeral key");
    return await apiCallback(ephemeralKey);
  } catch (error) {
    console.error("[ephemeralKeyService] [TokenFetchError] Error in secure API call:", error);
    throw new Error(`Secure API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
