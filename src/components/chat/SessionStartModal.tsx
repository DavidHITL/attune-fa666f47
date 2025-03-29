
import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import AvailableSessions from "./AvailableSessions";

interface SessionStartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartSession: () => void;
}

const SessionStartModal: React.FC<SessionStartModalProps> = ({
  open,
  onOpenChange,
  onStartSession
}) => {
  const navigate = useNavigate();

  const handleCloseModal = () => {
    // Redirect to the "you" page when user clicks X
    navigate("/you");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleCloseModal();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">Start Your Session</DialogTitle>
          <DialogDescription>
            You're about to begin a 25-minute therapeutic chat session. 
            During this time, you can discuss anything that's on your mind.
          </DialogDescription>
        </DialogHeader>
        
        {/* Available Sessions Component */}
        <div className="flex justify-center mt-2 mb-4">
          <AvailableSessions />
        </div>
        
        <div className="flex flex-col space-y-4">
          <p>Sessions are limited to 25 minutes to create a focused, effective therapeutic framework.</p>
          <p>You can end your session early if needed, but the timer cannot be paused.</p>
        </div>
        <DialogFooter className="mt-6">
          <Button onClick={onStartSession} className="w-full">
            Start 25-Minute Session
          </Button>
        </DialogFooter>
        
        {/* Custom close button that redirects to /you */}
        <DialogClose 
          onClick={handleCloseModal}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

export default SessionStartModal;
