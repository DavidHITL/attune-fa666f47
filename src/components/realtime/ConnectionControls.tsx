
import React from "react";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

interface ConnectionControlsProps {
  isConnected: boolean;
  isConnecting: boolean;
  onClose?: () => void;
}

/**
 * Controls for managing the voice chat connection
 */
const ConnectionControls: React.FC<ConnectionControlsProps> = ({
  isConnected,
  isConnecting,
  onClose
}) => {
  if (!isConnected) return null;
  
  return (
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
  );
};

export default ConnectionControls;
