
import React, { useState, useRef, useEffect } from "react";
import MessageBubble, { Message } from "./MessageBubble";
import ChatInput from "./ChatInput";
import { generateResponse } from "./ChatResponseGenerator";
import { speakMessage } from "./ChatSpeech";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ChatConversationProps {
  isSpeechEnabled: boolean;
}

const ChatConversation: React.FC<ChatConversationProps> = ({ isSpeechEnabled }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Fetch messages from Supabase when component mounts
  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: "Error loading messages",
          description: "Could not load your chat history.",
          variant: "destructive"
        });
        
        // If no messages, add a welcome message
        setMessages([{
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        }]);
        
        return;
      }
      
      if (data && data.length > 0) {
        // Transform database messages to our app format
        const formattedMessages: Message[] = data.map(dbMessage => ({
          id: dbMessage.id.toString(), // Ensure ID is a string
          text: dbMessage.content || '',
          isUser: dbMessage.sender_type === 'user',
          timestamp: new Date(dbMessage.created_at)
        }));
        setMessages(formattedMessages);
      } else {
        // If no messages, add a welcome message
        const welcomeMsg = {
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages([welcomeMsg]);
        
        // Save the welcome message to database
        await saveMessageToDatabase("Hi there. How are you feeling today?", false);
      }
    } catch (error) {
      console.error("Error in fetchMessages:", error);
      toast({
        title: "Error loading messages",
        description: "Could not load your chat history. Using local messages instead.",
        variant: "destructive"
      });
      
      // Set a welcome message if we can't load from the database
      setMessages([{
        id: "welcome",
        text: "Hi there. How are you feeling today?",
        isUser: false,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
      setIsInitialLoad(false);
    }
  };

  const saveMessageToDatabase = async (text: string, isUser: boolean) => {
    try {
      if (!user) return; // Don't save if no user is logged in
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: text,
          user_id: user.id,
          sender_type: isUser ? 'user' : 'bot'
        })
        .select();
      
      if (error) {
        console.error("Error saving message to database:", error);
        throw error;
      }
      
      return data?.[0]?.id;
    } catch (error) {
      console.error("Failed to save message:", error);
      // Continue with local message handling even if database save fails
      return null;
    }
  };

  const handleSendMessage = async (text: string) => {
    // Create new user message
    const newUserMessage: Message = {
      id: Date.now().toString(), // Convert to string
      text,
      isUser: true,
      timestamp: new Date()
    };

    // Add user message to local state
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    
    // Save user message to database and get the saved message ID
    const savedMessageId = await saveMessageToDatabase(text, true);
    if (savedMessageId) {
      // Update the message ID in state if we got one from the database
      newUserMessage.id = savedMessageId.toString();
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newUserMessage.id ? {...msg, id: savedMessageId.toString()} : msg
        )
      );
    }
    
    setIsLoading(true);

    try {
      const botResponse = await generateResponse(
        text, 
        messages, 
        useLocalFallback, 
        setUseLocalFallback
      );

      // Save bot response to database and get the saved message ID
      const savedBotMessageId = await saveMessageToDatabase(botResponse.text, false);
      if (savedBotMessageId) {
        botResponse.id = savedBotMessageId.toString();
      }

      // Add bot response to local state
      setMessages((prevMessages) => [...prevMessages, botResponse]);
      
      // Speak the bot's response if speech is enabled
      speakMessage(botResponse.text, isSpeechEnabled);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to the most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          {isInitialLoad ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-pulse flex flex-col space-y-4">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          )}
          {isLoading && (
            <div className="flex items-center justify-start mb-4">
              <div className="bg-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-500 animate-bounce" style={{ animationDelay: "600ms" }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatConversation;
