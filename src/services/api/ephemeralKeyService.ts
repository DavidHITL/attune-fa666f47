
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    
    // Check if we're already fetching a token (prevent duplicate requests)
    const pendingToken = localStorage.getItem('pendingEphemeralKeyRequest');
    if (pendingToken) {
      const pendingTimestamp = parseInt(pendingToken);
      // If there's a pending request less than 5 seconds old, wait for it
      if (Date.now() - pendingTimestamp < 5000) {
        console.log("[EphemeralKey] [TokenFetch] Another token request is in progress, waiting...");
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        return getEphemeralKey(options); // Retry
      }
    }
    
    // Set pending token request flag
    localStorage.setItem('pendingEphemeralKeyRequest', Date.now().toString());
    
    // Request an ephemeral key from the edge function
    const response = await supabase.functions.invoke('generate-ephemeral-key', {
      body: {
        model: options.model || 'gpt-4o-realtime-preview-2024-12-17',
        voice: options.voice || 'alloy',
        instructions: options.instructions || 'You are a helpful, conversational AI assistant.',
        userId: options.userId
      }
    });
    
    // Clear pending token request flag
    localStorage.removeItem('pendingEphemeralKeyRequest');
    
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

    // Get the token from the response
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
    
    // Show a user-friendly toast
    toast.error("Could not connect to OpenAI. Please try again later.");
    
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
    
    // Implement retry logic with exponential backoff
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        // Get an ephemeral key with proper await
        const apiKey = await getEphemeralKey(options);
        
        if (!apiKey) {
          throw new Error("Empty API key received");
        }
        
        // Log the operation details
        console.log("[SecureOpenAI] [TokenFetch] Ephemeral key received, executing secure operation");
        
        // Execute the function with the key
        return await fn(apiKey);
      } catch (err) {
        retries++;
        console.error(`[SecureOpenAI] [TokenFetch] [ERROR] Attempt ${retries}/${maxRetries} failed:`, err);
        
        // If we've reached max retries, throw the error
        if (retries > maxRetries) {
          throw err;
        }
        
        // Wait with exponential backoff before retrying (1s, 2s, 4s)
        const backoffTime = Math.pow(2, retries - 1) * 1000;
        console.log(`[SecureOpenAI] [TokenFetch] Retrying in ${backoffTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
    
    throw new Error("Maximum retries exceeded");
  } catch (error) {
    console.error("[SecureOpenAI] [TokenFetch] [ERROR] Error executing with secure OpenAI:", error);
    console.error("[SecureOpenAI] [TokenFetch] [ERROR] Stack trace:", error instanceof Error ? error.stack : "No stack trace available");
    
    // Show a user-friendly toast for failures
    toast.error("Connection to AI services failed. Please try again later.");
    
    throw error;
  }
}
