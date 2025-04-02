
import { Message } from "@/components/MessageBubble";
import { createMessageObject } from "@/services/messages/messageUtils";
import { prepareConversationHistory, generateLocalResponse } from "./messagePreparation";
import { prepareContextData } from "./contextPreparation";
import { callChatResponseApi } from "./apiService";

// Define ResponseGeneratorOptions interface here since we have an error importing it
export interface ResponseGeneratorOptions {
  sessionProgress?: number;
  useContextEnrichment?: boolean;
}

// Define ApiRequestPayload interface here to avoid import errors
export interface ApiRequestPayload {
  messages: { role: string; content: string }[];
  sessionProgress: number;
  contextData: any;
}

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

// Helper function to generate UUIDs
function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
