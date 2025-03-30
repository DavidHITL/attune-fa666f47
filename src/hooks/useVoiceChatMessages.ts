
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export type VoiceChatMessage = {
  role: 'user' | 'assistant';
  text: string;
  timestamp?: Date;
};

export function useVoiceChatMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<VoiceChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadMessages = async () => {
    try {
      if (!user) return;
      
      console.log("[useVoiceChatMessages] Loading messages for user:", user.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) {
        console.error("[useVoiceChatMessages] Error loading messages:", error);
        toast.error("Failed to load messages");
        return;
      }
      
      console.log("[useVoiceChatMessages] Loaded messages:", data?.length || 0);
      
      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          role: msg.sender_type === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
          text: msg.content || '',
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("[useVoiceChatMessages] Error in loadMessages:", error);
      toast.error("Failed to load messages");
    }
  };

  const saveMessageToDatabase = async (text: string, isUser: boolean) => {
    try {
      if (!user) return;
      
      console.log("[useVoiceChatMessages] Saving message to database:", isUser ? "user" : "assistant");
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: text,
          user_id: user.id,
          sender_type: isUser ? 'user' : 'bot'
        })
        .select();
      
      if (error) {
        console.error("[useVoiceChatMessages] Error saving message to database:", error);
        throw error;
      }
      
      console.log("[useVoiceChatMessages] Message saved successfully:", data?.[0]?.id);
      return data?.[0]?.id;
    } catch (error) {
      console.error("[useVoiceChatMessages] Failed to save message:", error);
      return null;
    }
  };

  const sendMessage = async (currentTranscript: string) => {
    if (!currentTranscript.trim()) {
      console.log("[useVoiceChatMessages] No transcript to send");
      return;
    }

    console.log("[useVoiceChatMessages] Sending message:", currentTranscript);

    // Add user message to chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: currentTranscript, 
      timestamp: new Date() 
    }]);
    
    // Save user message to database
    await saveMessageToDatabase(currentTranscript, true);
    
    // Simulate AI response (in a real app, you'd call an API here)
    setIsProcessing(true);

    // For demo purposes, we'll just echo back the user's message with a delay
    setTimeout(async () => {
      const aiResponse = `I received your message: "${currentTranscript}". This is a simulated response since the realtime chat feature is currently being rebuilt.`;
      
      console.log("[useVoiceChatMessages] Simulated AI response:", aiResponse);
      
      // Add AI response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: aiResponse,
        timestamp: new Date()
      }]);

      // Save AI message to database
      await saveMessageToDatabase(aiResponse, false);
      
      setIsProcessing(false);
    }, 1500);
  };

  return {
    messages,
    isProcessing,
    loadMessages,
    sendMessage
  };
}
