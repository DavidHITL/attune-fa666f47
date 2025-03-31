
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Request an ephemeral API key from the server
 * @returns Promise with the ephemeral key and its expiration time
 */
export const requestEphemeralKey = async () => {
  try {
    // Check if user is authenticated first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No valid session found when requesting ephemeral key");
      throw new Error("Authentication required");
    }
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('generate-ephemeral-key', {
      method: 'POST'
    });

    if (error) {
      console.error("Error requesting ephemeral key:", error);
      throw new Error(`Failed to get ephemeral key: ${error.message}`);
    }

    if (!data || !data.ephemeralKey) {
      throw new Error("Invalid response from server");
    }

    return {
      ephemeralKey: data.ephemeralKey,
      expiresAt: new Date(data.expiresAt)
    };
  } catch (error) {
    console.error("Error in requestEphemeralKey:", error);
    toast({
      title: "API Error",
      description: "Failed to obtain API access. Please try again.",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Verify an ephemeral key and get the actual OpenAI API key
 * @param ephemeralKey The ephemeral key to verify
 * @returns Promise with the actual OpenAI API key and its expiration time
 */
export const verifyEphemeralKey = async (ephemeralKey: string) => {
  try {
    // Check if user is authenticated first
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No valid session found when verifying ephemeral key");
      throw new Error("Authentication required");
    }
    
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('verify-ephemeral-key', {
      method: 'POST',
      body: { ephemeralKey }
    });

    if (error) {
      console.error("Error verifying ephemeral key:", error);
      throw new Error(`Failed to verify key: ${error.message}`);
    }

    if (!data || !data.openaiKey) {
      throw new Error("Invalid response from server");
    }

    return {
      openaiKey: data.openaiKey,
      expiresAt: new Date(data.expiresAt)
    };
  } catch (error) {
    console.error("Error in verifyEphemeralKey:", error);
    toast({
      title: "API Key Error",
      description: "Failed to authenticate with OpenAI API. Please try again.",
      variant: "destructive"
    });
    throw error;
  }
};

/**
 * Complete OpenAI API flow: request ephemeral key, verify it, and use the actual API key
 * @param apiCall Function that will use the OpenAI API key
 * @returns Promise with the result of the API call
 */
export const withSecureOpenAI = async <T>(apiCall: (apiKey: string) => Promise<T>): Promise<T> => {
  try {
    // Step 1: Get ephemeral key
    const { ephemeralKey } = await requestEphemeralKey();
    
    // Step 2: Verify ephemeral key and get actual OpenAI API key
    const { openaiKey } = await verifyEphemeralKey(ephemeralKey);
    
    // Step 3: Use the actual OpenAI API key for the API call
    return await apiCall(openaiKey);
  } catch (error) {
    console.error("Error in withSecureOpenAI:", error);
    throw error;
  }
};
