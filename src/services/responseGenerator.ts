
import { Message } from "@/components/MessageBubble";
import { createMessageObject } from "./chatApiService";
import { withSecureOpenAI } from "./api/ephemeralKeyService";

/**
 * Generate a response to the user's message
 * @param userMessage The message from the user
 * @param conversation Previous messages in the conversation
 * @param useLocalFallback Whether to use local fallback mode
 * @param setUseLocalFallback Function to update local fallback mode state
 * @param sessionProgress Current session progress (0-100)
 * @returns Promise with the generated response
 */
export const generateResponse = async (
  userMessage: string,
  conversation: Message[],
  useLocalFallback: boolean,
  setUseLocalFallback: React.Dispatch<React.SetStateAction<boolean>>,
  sessionProgress: number = 0
): Promise<Message> => {
  try {
    // For local fallback mode, generate a simple response
    if (useLocalFallback) {
      return generateLocalResponse(userMessage);
    }

    // Convert conversation history to the format expected by the API
    const messages = prepareConversationHistory(conversation);
    
    // Add the most recent user message
    messages.push({ role: "user", content: userMessage });

    console.log("Generating response with session progress:", sessionProgress);

    // Using ephemeral key service to securely make the API call
    const response = await withSecureOpenAI(async (openaiKey) => {
      try {
        const response = await fetch("https://oseowhythgbqvllwonaz.supabase.co/functions/v1/generateChatResponse", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            messages,
            sessionProgress
          })
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

    return createMessageObject(response, false);
  } catch (error) {
    console.error("Error in generateResponse:", error);
    setUseLocalFallback(true);
    return generateLocalResponse(userMessage);
  }
};

/**
 * Generate a local response without making API calls
 */
const generateLocalResponse = (userMessage: string): Message => {
  return createMessageObject(
    "I'm sorry, we're currently having trouble connecting to the AI service. Please try again later.",
    false
  );
};

/**
 * Prepare conversation history for the API
 */
const prepareConversationHistory = (conversation: Message[]) => {
  return conversation.map(msg => ({
    role: msg.isUser ? "user" : "assistant",
    content: msg.text
  }));
};
