
import { Message } from "@/components/MessageBubble";
import { v4 as uuidv4 } from 'uuid';
import type { ResponseGeneratorOptions } from "./types";

export type { ResponseGeneratorOptions } from "./types";

/**
 * Generate a response to a user message.
 */
export async function generateResponse(
  text: string,
  prevMessages: Message[],
  useLocalFallback: boolean = false,
  setUseLocalFallback: React.Dispatch<React.SetStateAction<boolean>> = () => {},
  options: ResponseGeneratorOptions = {}
): Promise<Message> {
  try {
    // Simple fallback response generator
    const response = `This is an AI response to "${text}"`;
    
    return {
      id: uuidv4(),
      text: response,
      isUser: false,
      timestamp: new Date(),
      messageType: "text"
    };
  } catch (error) {
    console.error("Error generating response:", error);
    
    // Simple error fallback
    return {
      id: uuidv4(),
      text: "I apologize, but I'm having trouble generating a response right now.",
      isUser: false,
      timestamp: new Date(),
      messageType: "text"
    };
  }
}
