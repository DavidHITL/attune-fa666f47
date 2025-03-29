
import React from 'react';
import { Phone } from "lucide-react";
import { DialogFooter } from "@/components/ui/dialog";

interface VoiceUIControlsProps {
  isConnecting: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
}

const VoiceUIControls: React.FC<VoiceUIControlsProps> = ({ 
  isConnecting, 
  connectionStatus 
}) => {
  return (
    <DialogFooter>
      <div className="flex gap-2 items-center justify-between w-full">
        <div className="text-xs text-gray-500">
          {isConnecting ? "Connecting to voice service..." : 
          connectionStatus === 'connected' ? "Voice service connected" : 
          "Voice service disconnected"}
        </div>
      </div>
    </DialogFooter>
  );
};

export default VoiceUIControls;
