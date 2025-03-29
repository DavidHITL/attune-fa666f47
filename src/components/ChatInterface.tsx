
import React, { useState, useRef, useEffect } from "react";
import MessageBubble, { Message } from "./MessageBubble";
import ChatInput from "./ChatInput";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const initialMessages: Message[] = [
  {
    id: "1",
    text: "Hi there. How are you feeling today?",
    isUser: false,
    timestamp: new Date()
  }
];

// Simple fallback function for local message processing
const generateLocalResponse = (message: string): string => {
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

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [useLocalFallback, setUseLocalFallback] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (text: string) => {
    // Add user message to chat
    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date()
    };

    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsLoading(true);

    try {
      let botResponse: Message;
      
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

          // Add AI response to chat
          botResponse = {
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
          botResponse = {
            id: (Date.now() + 1).toString(),
            text: localReply,
            isUser: false,
            timestamp: new Date()
          };
        }
      } else {
        // Use local response generation
        const localReply = generateLocalResponse(text);
        botResponse = {
          id: (Date.now() + 1).toString(),
          text: localReply,
          isUser: false,
          timestamp: new Date()
        };
      }

      setMessages((prevMessages) => [...prevMessages, botResponse]);
    } catch (error) {
      console.error("Error getting chat response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response. Please try again.",
        variant: "destructive"
      });

      // Add fallback response in case of error
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I couldn't process your message right now. Please try again later.",
        isUser: false,
        timestamp: new Date()
      };

      setMessages((prevMessages) => [...prevMessages, errorResponse]);
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
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
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
      <div className="max-w-2xl mx-auto w-full">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatInterface;
