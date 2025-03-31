
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface MessageInputProps {
  isConnected: boolean;
  onSubmit: (text: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ isConnected, onSubmit }) => {
  const [textInput, setTextInput] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textInput.trim()) return;
    
    onSubmit(textInput);
    setTextInput("");
  };
  
  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={textInput}
        onChange={(e) => setTextInput(e.target.value)}
        placeholder={isConnected ? "Type a message..." : "Connect to start chatting..."}
        disabled={!isConnected}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <Button 
        type="submit" 
        disabled={!isConnected || !textInput.trim()}
      >
        <Send size={18} />
      </Button>
    </form>
  );
};

export default MessageInput;
