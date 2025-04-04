
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
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
    console.log("CallModal: closing modal");
    onOpenChange(false);
  };
  
  // Generate a unique key whenever the modal opens to force a fresh mount of RealtimeChat
  const componentKey = `voice-chat-${open ? 'open' : 'closed'}-${Date.now()}`;
  
  console.log("CallModal rendered, open state:", open, "with key:", componentKey);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Voice Chat
          </DialogTitle>
        </DialogHeader>
        
        {/* Only render RealtimeChat when the modal is open */}
        {open && (
          <RealtimeChat 
            key={componentKey}
            sessionStarted={sessionStarted}
            sessionEndTime={sessionEndTime}
            onClose={handleCloseModal}
            autoConnect={true}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;
