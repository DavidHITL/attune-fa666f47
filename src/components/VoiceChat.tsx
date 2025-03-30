
import React from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import VoiceConnectionStatus from "./voice/VoiceConnectionStatus";
import { useVoiceChatConnection } from "@/hooks/useVoiceChatConnection";
import { useAuth } from "@/context/AuthContext";
import VoiceVisualization from "./voice/VoiceVisualization";
import { ArrowLeft } from "lucide-react";

// Create and export the VoiceChat component
export function VoiceChat({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { user } = useAuth();
  const {
    chatRef,
    connect,
    disconnect,
  } = useVoiceChat(user);

  const { connectionStatus, isConnecting } = useVoiceChatConnection({
    open,
    connect,
    disconnect,
    chatRef
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col items-center justify-between p-8">
        <div className="flex justify-between items-center w-full mb-6">
          <h2 className="text-lg font-medium">Voice Conversation</h2>
          <VoiceConnectionStatus status={connectionStatus} />
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <VoiceVisualization 
            isActive={connectionStatus === 'connected'} 
            className="mb-8" 
          />
          
          <p className="text-center text-lg text-gray-700 max-w-md mb-8">
            Speak naturally with the AI assistant or click the button below to return to text chat.
          </p>
        </div>
        
        <Button
          onClick={() => onOpenChange(false)}
          className="w-full max-w-xs"
          variant="outline"
        >
          <ArrowLeft className="mr-2" size={16} />
          Back to Text
        </Button>
      </DialogContent>
    </Dialog>
  );
}
