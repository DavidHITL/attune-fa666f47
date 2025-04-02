
import { Message } from "@/components/MessageBubble";
import { createMessageObject } from "@/services/messages/messageUtils";
import { prepareConversationHistory, generateLocalResponse } from "./messagePreparation";
import { prepareContextData } from "./contextPreparation";
import { callChatResponseApi } from "./apiService";
import { ResponseGeneratorOptions, ApiRequestPayload } from "./types";
import { toast } from "sonner";

/**
 * Generate a response to the user's message
 */
export const generateResponse = async (
  userMessage: string,
  conversation: Message[],
  useLocalFallback: boolean,
  setUseLocalFallback: React.Dispatch<React.SetStateAction<boolean>>,
  options: ResponseGeneratorOptions = {}
): Promise<Message> => {
  const { sessionProgress = 0, useContextEnrichment = true } = options;

  // Validate user input
  if (!userMessage.trim()) {
    return createMessageObject(
      "I'm sorry, but I didn't receive any message. Could you please try again?",
      false
    );
  }
  
  try {
    // For local fallback mode, generate a simple response
    if (useLocalFallback) {
      return createMessageObject(generateLocalResponse(userMessage), false);
    }

    // Convert conversation history to the format expected by the API
    const messages = prepareConversationHistory(conversation);
    
    // Add the most recent user message
    messages.push({ role: "user", content: userMessage });

    console.log("Generating response with session progress:", sessionProgress);

    // Prepare payload for API request
    const payload: ApiRequestPayload = {
      messages,
      sessionProgress,
      contextData: null
    };
    
    // Fetch and add context data if enabled
    if (useContextEnrichment) {
      payload.contextData = await prepareContextData();
    }

    // Call the API to generate a response
    const response = await callChatResponseApi(payload);
    return createMessageObject(response, false);
    
  } catch (error) {
    console.error("Error in generateResponse:", error);
    
    // Show error toast to user
    toast.error("Sorry, there was an error generating a response. Falling back to local mode.");
    
    // Enable local fallback mode for future messages
    setUseLocalFallback(true);
    
    // Return a fallback message using local generation
    return createMessageObject(generateLocalResponse(userMessage), false);
  }
};

// Re-export types for convenience
export type { ResponseGeneratorOptions } from "./response/types";
