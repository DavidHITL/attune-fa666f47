
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";

interface CallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CallModal: React.FC<CallModalProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Voice Call</DialogTitle>
          <DialogDescription>
            Start a voice call with your therapeutic AI assistant
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="bg-gray-100 rounded-full p-6">
            <Phone className="h-12 w-12 text-primary" />
          </div>
          <p className="text-center">
            Voice calls allow for a more personal conversation with your AI assistant.
            Would you like to initiate a voice call now?
          </p>
        </div>
        
        <div className="flex justify-center gap-4 mt-4">
          <DialogClose asChild>
            <Button variant="outline" className="gap-2">
              <PhoneOff className="h-4 w-4" />
              Cancel
            </Button>
          </DialogClose>
          <Button className="gap-2">
            <Phone className="h-4 w-4" />
            Start Call
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CallModal;
