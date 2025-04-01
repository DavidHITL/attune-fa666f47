
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import MicrophoneButton from '@/components/realtime/MicrophoneButton';
import MicrophoneStatus from '@/components/realtime/MicrophoneStatus';
import TranscriptDisplay from '@/components/realtime/TranscriptDisplay';
import { Button } from '@/components/ui/button';
import { toast } from "sonner";

interface RealtimeChatProps {
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
  onClose?: () => void;
}

const RealtimeChat: React.FC<RealtimeChatProps> = ({
  sessionStarted = false,
  sessionEndTime = null,
  onClose
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isConnecting, setIsConnecting] = useState(true);
  
  // Connect immediately when component mounts
  useEffect(() => {
    const initializeConnection = async () => {
      // Simulate connection process with a delay
      try {
        setIsConnecting(true);
        // In a real implementation, this would be the actual connection logic
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsConnected(true);
        toast.success("Voice connection established");
      } catch (error) {
        console.error("Connection error:", error);
        toast.error("Failed to establish voice connection");
      } finally {
        setIsConnecting(false);
      }
    };
    
    initializeConnection();
    
    // Cleanup on unmount
    return () => {
      setIsConnected(false);
      setIsMicrophoneActive(false);
    };
  }, []);
  
  // Mock function for microphone toggle - will be replaced by actual implementation
  const handleMicrophoneToggle = async () => {
    if (isMicrophoneActive) {
      setIsMicrophoneActive(false);
      return true;
    } else {
      setIsMicrophoneActive(true);
      // Simulate AI response when microphone is activated
      setTimeout(() => {
        setIsAiSpeaking(true);
        setTimeout(() => {
          setCurrentTranscript("How can I help you today?");
          setTimeout(() => {
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
      
      {/* Transcript Display */}
      {isConnected && (
        <TranscriptDisplay 
          isConnected={isConnected}
          isAiSpeaking={isAiSpeaking}
          isProcessingAudio={false}
          currentTranscript={currentTranscript}
        />
      )}
      
      {/* Control Buttons */}
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
          End Call
        </Button>
      </div>
    </div>
  );
};

export default RealtimeChat;
