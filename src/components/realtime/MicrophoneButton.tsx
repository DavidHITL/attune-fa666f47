
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";

interface MicrophoneButtonProps {
  isActive: boolean;
  isDisabled: boolean;
  onClick: () => Promise<boolean>;
  className?: string;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isActive,
  isDisabled,
  onClick,
  className = ""
}) => {
  const handleClick = async () => {
    try {
      await onClick();
    } catch (error) {
      console.error("Error toggling microphone:", error);
    }
  };
  
  return (
    <Button 
      size="sm"
      variant={isActive ? "default" : "outline"}
      onClick={handleClick}
      disabled={isDisabled}
      className={`flex items-center gap-1 ${className}`}
      title={isActive ? "Mute microphone" : "Unmute microphone"}
    >
      {isActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
      {isActive ? "Mute" : "Speak"}
    </Button>
  );
};

export default MicrophoneButton;
