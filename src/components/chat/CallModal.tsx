
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";
import RealtimeChat from "@/components/realtime/RealtimeChat";

interface CallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
}

const CallModal: React.FC<CallModalProps> = ({ 
  open, 
  onOpenChange,
  sessionStarted = false,
  sessionEndTime = null 
}) => {
  const handleCloseModal = () => {
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Voice Chat
          </DialogTitle>
        </DialogHeader>
        
        <RealtimeChat 
          sessionStarted={sessionStarted}
          sessionEndTime={sessionEndTime}
          onClose={handleCloseModal}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;
