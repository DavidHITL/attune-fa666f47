
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start Your Session</DialogTitle>
          <DialogDescription>
            You're about to begin a 25-minute therapeutic chat session. 
            During this time, you can discuss anything that's on your mind.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4 mt-4">
          <p>Sessions are limited to 25 minutes to create a focused, effective therapeutic framework.</p>
          <p>You can end your session early if needed, but the timer cannot be paused.</p>
        </div>
        <DialogFooter className="mt-6">
          <Button onClick={onStartSession} className="w-full">
            Start 25-Minute Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionStartModal;
