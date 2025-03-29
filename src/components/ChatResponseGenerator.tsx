
import { Message } from "./MessageBubble";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Simple fallback function for local message processing
export const generateLocalResponse = (message: string): string => {
  if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
    return "Hello! How are you feeling today?";
  } else if (message.toLowerCase().includes("good") || message.toLowerCase().includes("fine")) {
    return "I'm glad to hear that! Is there anything specific you'd like to talk about?";
  } else if (message.toLowerCase().includes("bad") || message.toLowerCase().includes("not good")) {
    return "I'm sorry to hear that. Would you like to share more about what's bothering you?";
  } else if (message.toLowerCase().includes("thank")) {
    return "You're welcome! I'm here to support you.";
  } else {
    return "Thank you for sharing. I'm listening and here to support you. Feel free to tell me more.";
  }
};

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
        const conversationHistory = messages.map(msg => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text
        }));

        console.log("Calling generateChatResponse function");

        // Call the Supabase Edge Function using the supabase client
        const { data, error } = await supabase.functions.invoke('generateChatResponse', {
          body: {
            message: text,
            conversationHistory
          }
        });

        if (error) {
          console.error("Supabase Function Error:", error);
          throw new Error(`Error calling function: ${error.message}`);
        }

        if (!data || !data.success) {
          throw new Error(data?.error || "Failed to get response");
        }

        // Return AI response
        return {
          id: (Date.now() + 1).toString(),
          text: data.reply,
          isUser: false,
          timestamp: new Date()
        };
      } catch (error) {
        console.error("Error with Supabase function, falling back to local processing:", error);
        setUseLocalFallback(true);
        
        // Generate local response as fallback
        const localReply = generateLocalResponse(text);
        return {
          id: (Date.now() + 1).toString(),
          text: localReply,
          isUser: false,
          timestamp: new Date()
        };
      }
    } else {
      // Use local response generation
      const localReply = generateLocalResponse(text);
      return {
        id: (Date.now() + 1).toString(),
        text: localReply,
        isUser: false,
        timestamp: new Date()
      };
    }
  } catch (error) {
    console.error("Error getting chat response:", error);
    toast({
      title: "Error",
      description: "Failed to get a response. Please try again.",
      variant: "destructive"
    });

    // Return fallback response in case of error
    return {
      id: (Date.now() + 1).toString(),
      text: "I'm sorry, I couldn't process your message right now. Please try again later.",
      isUser: false,
      timestamp: new Date()
    };
  }
};
