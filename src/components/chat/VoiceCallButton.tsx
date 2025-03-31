
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
    
    // Show a more detailed toast message
    uiToast({
      title: "Connecting to OpenAI GPT-4o voice service",
      description: "Establishing direct connection to the OpenAI Realtime API...",
    });
    
    // Show a more visible toast using sonner with longer timeout
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
        }, 500); // Slightly longer animation for better feedback
      }),
      {
        loading: 'Connecting to OpenAI GPT-4o...',
        success: 'Connection to voice service established!',
        error: 'Connection failed. Please try again later.',
        duration: 5000 // Longer duration to ensure user sees the message
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
      title="Start voice conversation with OpenAI GPT-4o"
    >
      <Phone className={`text-blue-600 ${isLoading ? 'animate-pulse' : ''}`} size={20} />
    </Button>
  );
};

export default VoiceCallButton;
