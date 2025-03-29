
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
    // Validate input
    if (!text || text.trim() === "") {
      return createMessageObject(
        "I didn't receive a message. Please try again.",
        false
      );
    }
    
    if (!useLocalFallback) {
      try {
        // Prepare conversation history for the API - include all previous messages
        const conversationHistory = convertMessagesToApiFormat(messages);

        // Call the Supabase Edge Function
        const reply = await callChatApi(text, conversationHistory);

        // Validate reply
        if (!reply || typeof reply !== "string" || reply.trim() === "") {
          throw new Error("Received an invalid response from the AI service");
        }

        // Return AI response
        return createMessageObject(reply, false);
      } catch (error) {
        console.error("Error with Supabase function, falling back to local processing:", error);
        setUseLocalFallback(true);
        
        // Show a toast notification about the fallback
        toast({
          title: "Using local response mode",
          description: "There was an issue with the AI service. Using simplified responses.",
          variant: "default"
        });
        
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
