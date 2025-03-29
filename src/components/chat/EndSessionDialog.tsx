
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EndSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmEnd: () => void;
}

const EndSessionDialog: React.FC<EndSessionDialogProps> = ({
  open,
  onOpenChange,
  onConfirmEnd
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End Session Early?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to end your session now? Any ongoing conversation will be saved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continue Session</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmEnd}>End Session</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default EndSessionDialog;
