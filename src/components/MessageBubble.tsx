
import React from "react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  messageType?: 'text' | 'voice';
}

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  // Format time to display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={cn(
        "mb-4 max-w-[80%]",
        message.isUser ? "ml-auto" : "mr-auto"
      )}
    >
      <div
        className={cn(
          "px-4 py-3 rounded-2xl",
          message.isUser
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-gray-200 text-gray-800 rounded-bl-none"
        )}
      >
        {message.messageType === 'voice' && (
          <div className="text-xs mb-1 opacity-70 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
            Voice Message
          </div>
        )}
        {message.text}
      </div>
      <div 
        className={cn(
          "text-xs mt-1 text-gray-500",
          message.isUser ? "text-right" : "text-left"
        )}
      >
        {formatTime(message.timestamp)}
      </div>
    </div>
  );
};

export default MessageBubble;
