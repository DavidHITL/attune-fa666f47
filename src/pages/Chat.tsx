
import React from "react";
import NavBar from "@/components/NavBar";
import Timer from "@/components/Timer";
import ChatInterface from "@/components/ChatInterface";

const Chat: React.FC = () => {
  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <Timer initialMinutes={17} />
      <div className="flex-1 overflow-hidden">
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
