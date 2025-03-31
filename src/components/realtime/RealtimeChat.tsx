
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import VoiceChat from "./VoiceChat";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { calculateSessionProgress } from "@/utils/sessionUtils";

interface RealtimeChatProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  sessionStarted = false,
  sessionEndTime = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voice, setVoice] = useState<"alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer">("alloy");
  
  // Calculate session progress to customize the prompt based on session state
  const sessionProgress = calculateSessionProgress(sessionStarted, sessionEndTime);
  
  // Customize system prompt based on session state
  const getSystemPrompt = () => {
    if (!sessionStarted) {
      return "You are a helpful AI assistant. Be concise in your responses.";
    }
    
    // For active session, use a more specific prompt related to the session
    return `You are an AI assistant specializing in communication and relationship coaching. You are currently in a session with the user. The session is ${sessionProgress.toFixed(0)}% complete. Be empathetic, supportive, and provide thoughtful guidance. Keep responses concise and helpful.`;
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button 
          onClick={() => setIsOpen(true)} 
          variant="default"
          className="rounded-full w-14 h-14 shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z"></path>
            <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"></path>
            <path d="m15 9-2-2"></path>
            <path d="m9 9 2-2"></path>
            <path d="m15 15-2 2"></path>
            <path d="m9 15 2 2"></path>
            <path d="M6 12h2"></path>
            <path d="M16 12h2"></path>
          </svg>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 shadow-xl">
      <Card className="w-[400px] max-w-[95vw]">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle>Voice Chat</CardTitle>
            <div className="flex space-x-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings2 size={18} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <X size={18} />
              </Button>
            </div>
          </div>
          <CardDescription>
            Connect to OpenAI using secure WebRTC
          </CardDescription>
        </CardHeader>
        
        {showSettings && (
          <CardContent className="pt-2 pb-2">
            <div className="space-y-2">
              <div>
                <label className="text-sm font-medium">AI Voice</label>
                <select 
                  className="w-full p-2 border rounded-md mt-1"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as any)}
                >
                  <option value="alloy">Alloy</option>
                  <option value="echo">Echo</option>
                  <option value="fable">Fable</option>
                  <option value="onyx">Onyx</option>
                  <option value="nova">Nova</option>
                  <option value="shimmer">Shimmer</option>
                </select>
              </div>
            </div>
          </CardContent>
        )}
        
        <CardContent>
          <VoiceChat 
            systemPrompt={getSystemPrompt()} 
            voice={voice}
            onClose={() => setIsOpen(false)}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeChat;

// Missing import
import { X } from 'lucide-react';
