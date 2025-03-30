import React from "react";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import VoiceConnectionStatus from "./voice/VoiceConnectionStatus";
import { useVoiceChatConnection } from "@/hooks/useVoiceChatConnection";
import { useAuth } from "@/context/AuthContext";
import VoiceVisualization from "./voice/VoiceVisualization";
import { ArrowLeft } from "lucide-react";
import VoiceUIControls from "./voice/VoiceUIControls";

// Create and export the VoiceChat component
export function VoiceChat({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    user
  } = useAuth();
  const {
    chatRef,
    connect,
    disconnect
  } = useVoiceChat(user);
  const {
    connectionStatus,
    isConnecting
  } = useVoiceChatConnection({
    open,
    connect,
    disconnect,
    chatRef
  });
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col items-center justify-between">
        <DialogHeader className="w-full">
          <div className="flex justify-between items-center w-full">
            <DialogTitle className="text-lg font-medium">Voice Conversation</DialogTitle>
            <VoiceConnectionStatus status={connectionStatus} />
          </div>
          <DialogDescription className="text-sm text-muted-foreground">
            Speak naturally with the AI assistant or use the button below to return to text chat.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <VoiceVisualization isActive={connectionStatus === 'connected'} className="mb-8" />
          
          
        </div>
        
        <div className="w-full space-y-4">
          <VoiceUIControls isConnecting={isConnecting} connectionStatus={connectionStatus} />
          
          <Button onClick={() => onOpenChange(false)} variant="outline" className="w-full max-w-xs mx-auto text-center">
            <ArrowLeft className="mr-2" size={16} />
            Back to Text
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}