
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
    onOpenChange(false);
  };
  
  // Use a key based on the open state to ensure the component is remounted
  // when the modal is reopened, which guarantees the useEffect runs again
  const componentKey = `realtime-chat-${open ? 'open' : 'closed'}`;
  
  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Voice Chat
          </DialogTitle>
        </DialogHeader>
        
        {/* Voice chat connects automatically when modal is opened */}
        {open && (
          <RealtimeChat 
            key={componentKey}
            sessionStarted={sessionStarted}
            sessionEndTime={sessionEndTime}
            onClose={handleCloseModal}
            autoConnect={true} // Always auto-connect
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;
