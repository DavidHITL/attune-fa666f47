
import { supabase } from "@/integrations/supabase/client";

/**
 * Get an ephemeral OpenAI API key from Supabase Edge Function
 */
export async function getEphemeralKey(): Promise<string> {
  try {
    console.log("[ephemeralKeyService] Requesting ephemeral key from Supabase");
    
    const { data, error } = await supabase.functions.invoke('generate-ephemeral-key');
    
    if (error) {
      console.error("[ephemeralKeyService] Error fetching ephemeral key:", error);
      throw new Error(`Failed to get ephemeral key: ${error.message}`);
    }
    
    if (!data || !data.client_secret?.value) {
      console.error("[ephemeralKeyService] Invalid response format:", data);
      throw new Error("Invalid ephemeral key response format");
    }
    
    console.log("[ephemeralKeyService] Successfully obtained ephemeral key");
    return data.client_secret.value;
  } catch (error) {
    console.error("[ephemeralKeyService] Exception getting ephemeral key:", error);
    throw new Error(`Failed to get ephemeral key: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Helper function to wrap API calls with secure OpenAI authentication
 */
export async function withSecureOpenAI<T>(
  apiCallback: (apiKey: string) => Promise<T>
): Promise<T> {
  try {
    console.log("[ephemeralKeyService] Starting secure OpenAI API call");
    const ephemeralKey = await getEphemeralKey();
    
    if (!ephemeralKey) {
      console.error("[ephemeralKeyService] No valid ephemeral key returned");
      throw new Error("Failed to get valid ephemeral key");
    }
    
    console.log("[ephemeralKeyService] Executing API callback with ephemeral key");
    return await apiCallback(ephemeralKey);
  } catch (error) {
    console.error("[ephemeralKeyService] Error in secure API call:", error);
    throw new Error(`Secure API call failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
