
import { Message } from "@/components/MessageBubble";
import { prepareConversationHistory, generateLocalResponse } from "./messagePreparation";
import { prepareContextData } from "./contextPreparation";
import { callChatResponseApi } from "./apiService";
import { v4 as uuidv4 } from 'uuid';
import { ApiRequestPayload, ApiMessage, ResponseGeneratorOptions } from "./types";

// Re-export types
export type { ResponseGeneratorOptions, ApiRequestPayload, ApiMessage };

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
    return {
      id: uuidv4(),
      text: "I'm sorry, but I didn't receive any message. Could you please try again?",
      isUser: false,
      timestamp: new Date(),
      messageType: 'text'
    } as Message;
  }
  
  try {
    // For local fallback mode, generate a simple response
    if (useLocalFallback) {
      return {
        id: uuidv4(),
        text: generateLocalResponse(userMessage),
        isUser: false,
        timestamp: new Date(),
        messageType: 'text'
      } as Message;
    }

    // Convert conversation history to the format expected by the API
    const messages = prepareConversationHistory(conversation);
    
    // Add the most recent user message
    messages.push({ role: "user" as const, content: userMessage });

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
    
    return {
      id: uuidv4(),
      text: response,
      isUser: false,
      timestamp: new Date(),
      messageType: 'text'
    } as Message;
    
  } catch (error) {
    console.error("Error in generateResponse:", error);
    
    // Show error toast to user
    // toast.error("Sorry, there was an error generating a response. Falling back to local mode.");
    
    // Enable local fallback mode for future messages
    setUseLocalFallback(true);
    
    // Return a fallback message using local generation
    return {
      id: uuidv4(),
      text: generateLocalResponse(userMessage),
      isUser: false,
      timestamp: new Date(),
      messageType: 'text'
    } as Message;
  }
};
