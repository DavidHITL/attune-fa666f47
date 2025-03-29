
import React, { useState } from "react";
import { Send } from "lucide-react";

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
      className="p-2 border-t border-gray-200 bg-white"
    >
      <div className="flex items-center relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded-full border border-gray-300 py-3 px-4 pr-10 focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`absolute right-3 ${
            isLoading || !message.trim() 
              ? "text-gray-400 cursor-not-allowed" 
              : "text-blue-500 hover:text-blue-700"
          }`}
          disabled={isLoading || !message.trim()}
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
};

export default ChatInput;
