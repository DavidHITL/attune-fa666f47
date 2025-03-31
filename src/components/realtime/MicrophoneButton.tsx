
import React from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff } from "lucide-react";
import { toast } from "sonner";

interface MicrophoneButtonProps {
  isConnected: boolean;
  isMicrophoneActive: boolean;
  microphonePermission: PermissionState | null;
  onToggle: () => Promise<boolean>;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isConnected,
  isMicrophoneActive,
  microphonePermission,
  onToggle,
}) => {
  if (!isConnected) return null;
  
  let buttonVariant: "default" | "destructive" | "outline" = "outline";
  let buttonTitle = "Enable microphone";
  let buttonIcon = <Mic size={16} />;
  let isDisabled = false;
  
  if (isMicrophoneActive) {
    buttonVariant = "destructive";
    buttonTitle = "Disable microphone";
    buttonIcon = <MicOff size={16} />;
  } else if (microphonePermission === 'denied') {
    buttonTitle = "Microphone blocked by browser";
    isDisabled = true;
  }
  
  return (
    <Button
      size="sm"
      variant={buttonVariant}
      onClick={onToggle}
      disabled={isDisabled}
      className="flex items-center gap-1"
      title={buttonTitle}
    >
      {buttonIcon}
      {isMicrophoneActive ? "Mute" : "Speak"}
    </Button>
  );
};

export default MicrophoneButton;
