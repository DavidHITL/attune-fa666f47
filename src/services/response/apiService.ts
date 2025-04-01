
import { withSecureOpenAI } from "@/services/api/ephemeralKeyService";
import { ApiRequestPayload } from "./types";

/**
 * Call the chat response API with secure OpenAI key
 */
export const callChatResponseApi = async (payload: ApiRequestPayload): Promise<string> => {
  console.log("Calling chat response API with payload:", {
    messageCount: payload.messages.length,
    sessionProgress: payload.sessionProgress,
    hasContextData: !!payload.contextData
  });
  
  // Using ephemeral key service to securely make the API call
  return withSecureOpenAI(async (openaiKey) => {
    try {
      const response = await fetch("https://oseowhythgbqvllwonaz.supabase.co/functions/v1/generateChatResponse", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response from API:", errorData);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      throw error;
    }
  });
};
