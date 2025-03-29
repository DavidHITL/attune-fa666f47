
import React from "react";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

interface VoiceCallButtonProps {
  onClick: () => void;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({ onClick }) => {
  return (
    <Button 
      variant="outline" 
      size="icon" 
      className="rounded-full hover:bg-blue-100 border-blue-200"
      onClick={onClick}
      title="Start voice conversation"
    >
      <PhoneCall className="text-blue-600" size={20} />
    </Button>
  );
};

export default VoiceCallButton;
