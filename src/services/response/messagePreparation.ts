
import { Message } from "@/components/MessageBubble";
import { ApiMessage } from "./types";

/**
 * Convert conversation messages to API format
 */
export const prepareConversationHistory = (conversation: Message[]): ApiMessage[] => {
  return conversation.map(msg => ({
    role: msg.isUser ? "user" : "assistant",
    content: msg.text
  }));
};

/**
 * Create a fallback response for when the API is unavailable
 */
export const generateLocalResponse = (userMessage: string): string => {
  if (userMessage.toLowerCase().includes("hello") || userMessage.toLowerCase().includes("hi")) {
    return "Hello! How are you feeling today?";
  } else if (userMessage.toLowerCase().includes("good") || userMessage.toLowerCase().includes("fine")) {
    return "I'm glad to hear that! Is there anything specific you'd like to talk about?";
  } else if (userMessage.toLowerCase().includes("bad") || userMessage.toLowerCase().includes("not good")) {
    return "I'm sorry to hear that. Would you like to share more about what's bothering you?";
  } else if (userMessage.toLowerCase().includes("thank")) {
    return "You're welcome! I'm here to support you.";
  } else {
    return "Thank you for sharing. I'm listening and here to support you. Feel free to tell me more.";
  }
};
