
import React, { useState } from "react";
import { Send } from "lucide-react";

// Define the interface for chat input props
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      onSendMessage(message);
      setMessage("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="p-2 border-t border-gray-200 bg-apple-gray-6 max-w-2xl mx-auto w-full"
    >
      <div className="flex items-center relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded-full border border-gray-300 py-3 px-4 pr-[80px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          disabled={isLoading}
        />
        <div className="absolute right-3 flex space-x-2">
          <button
            type="submit"
            className={`${
              isLoading || !message.trim() 
                ? "text-gray-400 cursor-not-allowed" 
                : "text-blue-500 hover:text-blue-700"
            }`}
            disabled={isLoading || !message.trim()}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default ChatInput;
