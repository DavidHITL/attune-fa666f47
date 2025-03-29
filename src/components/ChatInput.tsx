
import React, { useState } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

// Define the interface for chat input props
interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading = false }) => {
  const [message, setMessage] = useState("");
  
  const { isListening, toggleListening, isSupported } = useSpeechRecognition({
    onTranscript: (transcript) => {
      setMessage((prev) => prev + ' ' + transcript);
    }
  });

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
          className="w-full rounded-full border border-gray-300 py-3 px-4 pr-[80px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
        />
        <div className="absolute right-3 flex space-x-2">
          <button
            type="button"
            onClick={toggleListening}
            className={`p-1 rounded-full ${
              isListening 
                ? "bg-red-500 text-white" 
                : "text-gray-500 hover:text-blue-500"
            }`}
            disabled={isLoading || !isSupported}
            title={isListening ? "Stop listening" : "Start listening"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
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
