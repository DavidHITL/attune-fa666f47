
import { Message } from "@/components/MessageBubble";
import { toast } from "@/hooks/use-toast";
import { generateLocalResponse } from "@/utils/localResponseGenerator";
import { callChatApi, convertMessagesToApiFormat, createMessageObject } from "./chatApiService";

// Function to generate a response, either from Supabase or locally
export const generateResponse = async (
  text: string,
  messages: Message[],
  useLocalFallback: boolean,
  setUseLocalFallback: (value: boolean) => void
): Promise<Message> => {
  try {
    if (!useLocalFallback) {
      try {
        // Prepare conversation history for the API
        const conversationHistory = convertMessagesToApiFormat(messages);

        // Call the Supabase Edge Function
        const reply = await callChatApi(text, conversationHistory);

        // Return AI response
        return createMessageObject(reply, false);
      } catch (error) {
        console.error("Error with Supabase function, falling back to local processing:", error);
        setUseLocalFallback(true);
        
        // Generate local response as fallback
        const localReply = generateLocalResponse(text);
        return createMessageObject(localReply, false);
      }
    } else {
      // Use local response generation
      const localReply = generateLocalResponse(text);
      return createMessageObject(localReply, false);
    }
  } catch (error) {
    console.error("Error getting chat response:", error);
    toast({
      title: "Error",
      description: "Failed to get a response. Please try again.",
      variant: "destructive"
    });

    // Return fallback response in case of error
    return createMessageObject(
      "I'm sorry, I couldn't process your message right now. Please try again later.", 
      false
    );
  }
};
