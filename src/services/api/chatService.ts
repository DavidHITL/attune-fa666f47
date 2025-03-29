
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ChatMessage } from "../messages/messageUtils";

// Function to call the Supabase Edge Function
export const callChatApi = async (
  message: string,
  conversationHistory: ChatMessage[]
): Promise<string> => {
  console.log("Calling generateChatResponse function");
  console.log("Conversation history length:", conversationHistory.length);
  
  try {
    // Check if the session is valid before making the request
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.error("No valid session found before API call");
      throw new Error("You need to be logged in to use the chat");
    }
    
    const { data, error } = await supabase.functions.invoke('generateChatResponse', {
      body: {
        message,
        conversationHistory
      }
    });

    if (error) {
      console.error("Supabase Function Error:", error);
      throw new Error(`Error calling function: ${error.message}`);
    }

    if (!data) {
      throw new Error("No response data received");
    }
    
    if (!data.success) {
      throw new Error(data?.error || "Failed to get response");
    }

    return data.reply;
  } catch (error) {
    console.error("Error in callChatApi:", error);
    throw error;
  }
};

// Helper function to verify database access before saving
export const testDatabaseAccess = async (): Promise<boolean> => {
  try {
    // First check if we can access the messages table
    const { error: testError } = await supabase
      .from('messages')
      .select('id')
      .limit(1);
      
    if (testError) {
      console.error("Database access test failed:", testError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error testing database access:", error);
    return false;
  }
};
