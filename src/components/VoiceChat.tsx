
import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import VoiceVisualization from "./voice/VoiceVisualization";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { useVoiceChatConnection } from "@/hooks/useVoiceChatConnection";
import { toast } from "sonner";
import VoiceConnectionStatus from "./voice/VoiceConnectionStatus";
import VoiceUIControls from "./voice/VoiceUIControls";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const chatRef = useRef<RealtimeChat | null>(null);
  
  // Initialize chat functionality with transcript handling
  const handleTranscript = (text: string) => {
    console.log("[VoiceChat] Transcript update:", text);
  };
  
  // Connect to OpenAI's Realtime API
  const connect = async () => {
    try {
      if (chatRef.current) return;
      
      console.log("[VoiceChat] Initializing real-time connection");
      chatRef.current = new RealtimeChat(handleTranscript);
      await chatRef.current.connect();
      
      console.log("[VoiceChat] Connection established");
      toast.success("Voice connection established");
    } catch (error) {
      console.error("[VoiceChat] Connection error:", error);
      toast.error("Failed to connect to voice service. Please check that your API key is correctly set.");
      throw error;
    }
  };
  
  // Disconnect from service
  const disconnect = () => {
    if (chatRef.current) {
      console.log("[VoiceChat] Closing connection");
      chatRef.current.disconnect();
      chatRef.current = null;
    }
  };
  
  // Manage connection state
  const { connectionStatus, isConnecting } = useVoiceChatConnection({
    open,
    connect,
    disconnect,
    chatRef
  });

  const handleClose = () => {
    disconnect();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">Voice Chat</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
          <VoiceVisualization isActive={connectionStatus === 'connected'} />
          
          <div className="flex flex-col items-center gap-2">
            <VoiceConnectionStatus status={connectionStatus} />
            
            <div className="text-center text-sm text-gray-500">
              {connectionStatus === 'connecting' ? 'Connecting to AI voice service...' : 
               connectionStatus === 'connected' ? 'Listening... Speak naturally with the AI.' :
               'Connection not established'}
            </div>
          </div>
          
          <Button 
            onClick={handleClose}
            size="lg"
            className="mt-4"
          >
            Switch Back to Text
          </Button>
        </div>
        
        <VoiceUIControls 
          isConnecting={isConnecting} 
          connectionStatus={connectionStatus}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
