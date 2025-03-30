
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { toast } from "sonner";

interface VoiceCallButtonProps {
  onClick: () => void;
}

const VoiceCallButton: React.FC<VoiceCallButtonProps> = ({ onClick }) => {
  const { toast: uiToast } = useToast();
  const [isClicked, setIsClicked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = () => {
    setIsClicked(true);
    setIsLoading(true);
    
    uiToast({
      title: "Connecting to voice service",
      description: "Please wait while we establish a connection...",
    });
    
    // Show a more visible toast using sonner
    toast.promise(
      new Promise((resolve, reject) => {
        setTimeout(() => {
          // Reset the clicked state after animation completes
          setIsClicked(false);
          
          try {
            onClick();
            resolve("Connected");
          } catch (error) {
            console.error("Error connecting to voice service:", error);
            reject(error);
          } finally {
            setIsLoading(false);
          }
        }, 300);
      }),
      {
        loading: 'Connecting to voice service...',
        success: 'Connection established!',
        error: 'Connection failed. Please try again later.'
      }
    );
  };

  return (
    <Button 
      variant="outline" 
      size="icon" 
      disabled={isLoading}
      className={`rounded-full hover:bg-blue-100 border-blue-300 transition-all duration-300 ${
        isClicked ? 'bg-blue-100 scale-95' : ''
      } ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      onClick={handleClick}
      title="Start voice conversation"
    >
      <Phone className={`text-blue-600 ${isLoading ? 'animate-pulse' : ''}`} size={20} />
    </Button>
  );
};

export default VoiceCallButton;
