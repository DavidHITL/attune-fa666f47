
import { supabase } from "@/integrations/supabase/client";

interface EphemeralKeyOptions {
  model?: string;
  voice?: string;
  instructions?: string;
  userId?: string;
}

/**
 * Get an ephemeral API key from the server
 */
export async function getEphemeralKey(options: EphemeralKeyOptions = {}): Promise<string> {
  try {
    console.log("[EphemeralKey] [TokenFetch] Requesting ephemeral OpenAI API key");
    console.time("[EphemeralKey] [TokenFetch] Token fetch duration");
    
    // Log if user ID is provided
    if (options.userId) {
      console.log(`[EphemeralKey] [TokenFetch] Request includes userId: ${options.userId.substring(0, 8)}...`);
    } else {
      console.log("[EphemeralKey] [TokenFetch] No userId provided, anonymous session");
    }
    
    // Request an ephemeral key from the edge function
    const response = await supabase.functions.invoke('generate-ephemeral-key', {
      body: {
        model: options.model || 'gpt-4o-realtime-preview-2024-12-17',
        voice: options.voice || 'alloy',
        instructions: options.instructions || 'You are a helpful, conversational AI assistant.',
        userId: options.userId
      }
    });
    
    console.timeEnd("[EphemeralKey] [TokenFetch] Token fetch duration");

    // Check for errors
    if (response.error) {
      console.error("[EphemeralKey] [TokenFetch] [ERROR] Error fetching ephemeral key from edge function:", response.error);
      throw new Error(`Failed to get ephemeral API key: ${response.error.message || 'Unknown error'}`);
    }

    // Extract data
    const data = response.data;
    if (!data) {
      console.error("[EphemeralKey] [TokenFetch] [ERROR] No data returned from edge function");
      throw new Error('No data returned from ephemeral key function');
    }

    // Get the token
    const apiKey = data.key;
    if (!apiKey) {
      console.error("[EphemeralKey] [TokenFetch] [ERROR] No API key in response:", data);
      throw new Error('No API key in response from ephemeral key function');
    }

    console.log(`[EphemeralKey] [TokenFetch] Successfully retrieved ephemeral key of length: ${apiKey.length}`);
    console.log(`[EphemeralKey] [TokenFetch] Key prefix: ${apiKey.substring(0, 5)}...`);

    return apiKey;
  } catch (error) {
    console.error("[EphemeralKey] [TokenFetch] [ERROR] Error getting ephemeral key:", error);
    console.error("[EphemeralKey] [TokenFetch] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    throw error;
  }
}

/**
 * Securely execute a function with an ephemeral OpenAI API key
 * This is used to avoid storing API keys in the client
 */
export async function withSecureOpenAI<T>(
  fn: (apiKey: string) => Promise<T>,
  options: EphemeralKeyOptions = {}
): Promise<T> {
  try {
    console.log("[SecureOpenAI] [TokenFetch] Starting secure OpenAI operation");
    
    // Get an ephemeral key
    const apiKey = await getEphemeralKey(options);
    
    // Log the operation details
    console.log("[SecureOpenAI] [TokenFetch] Ephemeral key received, executing secure operation");
    
    // Execute the function with the key
    return await fn(apiKey);
  } catch (error) {
    console.error("[SecureOpenAI] [TokenFetch] [ERROR] Error executing with secure OpenAI:", error);
    console.error("[SecureOpenAI] [TokenFetch] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    throw error;
  }
}
