
import React from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface VoiceCallButtonProps {
  onClick: () => void;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({ onClick }) => {
  const handleClick = () => {
    // Display a toast message indicating voice functionality is disabled
    toast.info("Voice chat functionality has been disabled");
    onClick();
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="rounded-full border-gray-300 opacity-60 cursor-not-allowed"
      onClick={handleClick}
      title="Voice chat has been disabled"
      disabled={true}
    >
      <span className="sr-only">Voice chat disabled</span>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="20" 
        height="20" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        className="text-gray-400"
      >
        <line x1="1" y1="1" x2="23" y2="23"></line>
        <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
        <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
        <line x1="12" y1="19" x2="12" y2="23"></line>
        <line x1="8" y1="23" x2="16" y2="23"></line>
      </svg>
    </Button>
  );
};

export default VoiceCallButton;
