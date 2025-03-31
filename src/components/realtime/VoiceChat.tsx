
import React, { useState, useEffect } from "react";
import { useWebRTCConnection } from "@/hooks/useWebRTCConnection";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Send, X } from "lucide-react";
import { toast } from "sonner";

interface VoiceChatProps {
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  onClose?: () => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  systemPrompt = "You are a helpful AI assistant. Be concise in your responses.",
  voice = "alloy",
  onClose
}) => {
  const [textInput, setTextInput] = useState("");
  
  const {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    currentTranscript,
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage
  } = useWebRTCConnection({
    instructions: systemPrompt,
    voice,
    autoConnect: false,
    enableMicrophone: false
  });

  // Handle form submission for text input
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!textInput.trim()) return;
    
    if (isConnected) {
      sendTextMessage(textInput);
      setTextInput("");
    } else {
      toast.error("Please connect to OpenAI first");
    }
  };

  // Handle component unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return (
    <div className="flex flex-col space-y-4 w-full max-w-xl mx-auto p-4 bg-white rounded-lg shadow-md">
      {/* Connection Status & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div 
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : 
              isConnecting ? "bg-yellow-500 animate-pulse" : "bg-red-500"
            }`}
          />
          <span className="text-sm font-medium">
            {isConnected ? "Connected" : isConnecting ? "Connecting..." : "Disconnected"}
          </span>
        </div>
        
        <div className="flex space-x-2">
          {isConnected ? (
            <>
              <Button
                size="sm"
                variant={isMicrophoneActive ? "destructive" : "outline"}
                onClick={() => toggleMicrophone()}
                disabled={!isConnected}
                className="flex items-center gap-1"
              >
                {isMicrophoneActive ? <MicOff size={16} /> : <Mic size={16} />}
                {isMicrophoneActive ? "Mute" : "Speak"}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={() => disconnect()}
                className="flex items-center gap-1"
              >
                <X size={16} />
                End Call
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              onClick={() => connect()}
              disabled={isConnecting}
              className="flex items-center gap-1"
            >
              {isConnecting ? "Connecting..." : "Start Voice Call"}
            </Button>
          )}
        </div>
      </div>
      
      {/* AI Transcript Display */}
      {isConnected && (
        <div className={`relative p-4 rounded-lg border ${
          isAiSpeaking ? "border-green-500 bg-green-50" : "border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">AI Response</h3>
            {isAiSpeaking && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
              </div>
            )}
          </div>
          <div className="text-gray-700 min-h-24 max-h-48 overflow-y-auto">
            {currentTranscript || (isConnected && !isAiSpeaking && "Say something or type a message below...")}
          </div>
        </div>
      )}
      
      {/* Text Input */}
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
    </div>
  );
};

export default VoiceChat;
