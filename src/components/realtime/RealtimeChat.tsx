
import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import MicrophoneButton from '@/components/realtime/MicrophoneButton';
import MicrophoneStatus from '@/components/realtime/MicrophoneStatus';
import { Button } from '@/components/ui/button';
import { Phone } from 'lucide-react';
import { toast } from "sonner";

interface RealtimeChatProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
  onClose?: () => void;
  autoConnect?: boolean;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  sessionStarted = false,
  sessionEndTime = null,
  onClose,
  autoConnect = false
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Connect immediately when component mounts
  useEffect(() => {
    console.log("RealtimeChat mounted, autoConnect:", autoConnect);
    if (autoConnect) {
      console.log("Auto-connect triggered for voice chat");
      connectVoiceChat();
    }
  }, [autoConnect]); // Re-add autoConnect dependency to ensure connection happens when prop changes
  
  const connectVoiceChat = async () => {
    // Simulate connection process with a delay
    try {
      console.log("Starting voice chat connection process");
      setIsConnecting(true);
      // In a real implementation, this would be the actual connection logic
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsConnected(true);
      console.log("Voice connection established successfully");
      toast.success("Voice connection established");
      
      // Auto-activate microphone after connection is established
      console.log("Auto-activating microphone");
      setTimeout(() => {
        handleMicrophoneToggle().catch(err => {
          console.error("Failed to auto-activate microphone:", err);
        });
      }, 500);
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to establish voice connection");
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("RealtimeChat component unmounting, cleaning up");
      setIsConnected(false);
      setIsMicrophoneActive(false);
    };
  }, []);
  
  // Mock function for microphone toggle - will be replaced by actual implementation
  const handleMicrophoneToggle = async () => {
    console.log("Microphone toggle requested, current state:", isMicrophoneActive);
    if (isMicrophoneActive) {
      setIsMicrophoneActive(false);
      console.log("Microphone deactivated");
      return true;
    } else {
      setIsMicrophoneActive(true);
      console.log("Microphone activated");
      // Simulate AI response when microphone is activated
      setTimeout(() => {
        console.log("AI speaking started");
        setIsAiSpeaking(true);
        setTimeout(() => {
          setTimeout(() => {
            console.log("AI speaking ended");
            setIsAiSpeaking(false);
          }, 1500);
        }, 500);
      }, 1000);
      return true;
    }
  };
  
  return (
    <div className="flex flex-col gap-4">
      {/* Voice Indicator */}
      <div className="relative flex flex-col items-center justify-center p-6 rounded-lg bg-gray-50 border border-gray-200">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center 
          ${isAiSpeaking ? 'bg-gray-200' : isMicrophoneActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center 
            ${isAiSpeaking ? 'bg-gray-300 animate-pulse' : isMicrophoneActive ? 'bg-blue-200 animate-pulse' : 'bg-gray-200'}`}>
            <div className={`w-10 h-10 rounded-full 
              ${isAiSpeaking ? 'bg-gray-400' : isMicrophoneActive ? 'bg-blue-400' : 'bg-gray-400'}`}>
            </div>
          </div>
        </div>
        
        <p className="mt-4 text-center text-sm">
          {isConnecting ? 'Connecting...' : 
           isAiSpeaking ? 'AI is speaking...' : 
           isMicrophoneActive ? 'Listening...' : 
           isConnected ? 'Ready to speak' : 'Voice chat inactive'}
        </p>
      </div>
      
      {/* Microphone Status */}
      <MicrophoneStatus isActive={isMicrophoneActive} />
      
      {/* Only show control buttons when connected */}
      {isConnected && (
        <div className="flex justify-center gap-4 mt-2">
          <MicrophoneButton 
            isActive={isMicrophoneActive}
            isDisabled={!isConnected || isConnecting}
            onClick={handleMicrophoneToggle}
          />
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={onClose}
            disabled={isConnecting}
          >
            <Phone className="h-4 w-4" />
            End Call
          </Button>
        </div>
      )}
      
      {/* Show loading indicator while connecting */}
      {isConnecting && (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default RealtimeChat;
