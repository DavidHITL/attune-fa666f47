
import React from "react";
import { cn } from "@/lib/utils";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
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
