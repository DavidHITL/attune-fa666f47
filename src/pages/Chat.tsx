
import React from "react";
import NavBar from "@/components/NavBar";
import Timer from "@/components/Timer";
import ChatInterface from "@/components/ChatInterface";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

const Chat: React.FC = () => {
  const handlePhoneCall = () => {
    // This function will be triggered when the phone button is clicked
    window.open("tel:+11234567890", "_blank");
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
            onClick={handlePhoneCall}
            title="Call for support"
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
    </div>
  );
};

export default Chat;
