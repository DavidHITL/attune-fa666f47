
import React, { useState } from "react";
import NavBar from "@/components/NavBar";
import Timer from "@/components/Timer";
import ChatInterface from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";
import VoiceChat from "@/components/VoiceChat";

const Chat: React.FC = () => {
  const [voiceChatOpen, setVoiceChatOpen] = useState(false);

  const handlePhoneClick = () => {
    setVoiceChatOpen(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <Timer initialMinutes={17} />
      <div className="relative flex-1 overflow-hidden">
        {/* Phone button in the top-right corner */}
        <div className="absolute top-2 right-2 z-10">
          <Button 
            variant="outline" 
            size="icon" 
            className="rounded-full hover:bg-blue-100 border-blue-200"
            onClick={handlePhoneClick}
            title="Start voice conversation"
          >
            <PhoneCall className="text-blue-600" size={20} />
          </Button>
        </div>
        <ChatInterface />
      </div>
      <footer className="text-center py-3 text-xs text-gray-500 border-t border-gray-200">
        understand yourself<br />
        Napkin LLC — Zurich
      </footer>
      
      <VoiceChat 
        open={voiceChatOpen} 
        onOpenChange={setVoiceChatOpen} 
      />
    </div>
  );
};

export default Chat;
