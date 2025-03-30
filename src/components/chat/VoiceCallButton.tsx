
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface VoiceCallButtonProps {
  onClick: () => void;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({ onClick }) => {
  const { toast } = useToast();
  const [isClicked, setIsClicked] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    
    toast({
      title: "Connecting to voice service",
      description: "Please wait while we establish a connection...",
    });
    
    // Reset the clicked state after animation completes
    setTimeout(() => {
      setIsClicked(false);
      onClick();
    }, 300);
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      className={`rounded-full hover:bg-blue-100 border-blue-300 transition-all duration-300 ${isClicked ? 'bg-blue-100 scale-95' : ''}`}
      onClick={handleClick}
      title="Start voice conversation"
    >
      <Phone className="text-blue-600" size={20} />
    </Button>
  );
};

export default VoiceCallButton;
