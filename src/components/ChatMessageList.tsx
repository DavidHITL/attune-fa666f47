
import React, { useRef, useEffect } from "react";
import MessageBubble, { Message } from "./MessageBubble";

interface ChatMessageListProps {
  messages: Message[];
  isLoading: boolean;
  isInitialLoad: boolean;
}

const ChatMessageList: React.FC<ChatMessageListProps> = ({ 
  messages,
  isLoading, 
  isInitialLoad
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the most recent message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (isInitialLoad) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-pulse flex flex-col space-y-4">
          <div className="h-4 bg-gray-200 rounded w-32"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
          <div className="h-4 bg-gray-200 rounded w-40"></div>
        </div>
      </div>
    );
  }

  return (
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
  );
};

export default ChatMessageList;
