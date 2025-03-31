
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// In-memory cache for the ephemeral key to avoid unnecessary requests
let cachedEphemeralKey: { key: string; expiresAt: Date } | null = null;
let cachedOpenAIKey: { key: string; expiresAt: Date } | null = null;

// Minimum time before expiry to trigger a refresh (30 seconds)
const REFRESH_THRESHOLD_MS = 30 * 1000;

/**
 * Request an ephemeral API key from the server
 * @returns Promise with the ephemeral key and its expiration time
 */
export const requestEphemeralKey = async () => {
  try {
    // If we have a cached key that's still valid (with refresh threshold)
    if (cachedEphemeralKey && new Date() < new Date(cachedEphemeralKey.expiresAt.getTime() - REFRESH_THRESHOLD_MS)) {
      console.log("Using cached ephemeral key");
      return cachedEphemeralKey;
    }
    
    console.log("Requesting new ephemeral key");
    
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

    // Store the ephemeral key in memory cache
    cachedEphemeralKey = {
      key: data.ephemeralKey,
      expiresAt: new Date(data.expiresAt)
    };

    return cachedEphemeralKey;
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
    // If we have a cached OpenAI key that's still valid (with refresh threshold)
    if (cachedOpenAIKey && new Date() < new Date(cachedOpenAIKey.expiresAt.getTime() - REFRESH_THRESHOLD_MS)) {
      console.log("Using cached OpenAI key");
      return cachedOpenAIKey;
    }
    
    console.log("Verifying ephemeral key to get OpenAI key");
    
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

    // Store the OpenAI key in memory cache
    cachedOpenAIKey = {
      key: data.openaiKey,
      expiresAt: new Date(data.expiresAt)
    };

    return cachedOpenAIKey;
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
    // Step 1: Get ephemeral key (with automatic refresh if needed)
    const { key: ephemeralKey } = await requestEphemeralKey();
    
    // Step 2: Verify ephemeral key and get actual OpenAI API key
    const { key: openaiKey } = await verifyEphemeralKey(ephemeralKey);
    
    // Step 3: Use the actual OpenAI API key for the API call
    return await apiCall(openaiKey);
  } catch (error) {
    console.error("Error in withSecureOpenAI:", error);
    throw error;
  }
};
