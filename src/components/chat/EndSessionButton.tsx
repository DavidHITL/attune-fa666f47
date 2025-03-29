
import React from "react";
import { Button } from "@/components/ui/button";

interface EndSessionButtonProps {
  onClick: () => void;
}

const EndSessionButton: React.FC<EndSessionButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      className="border-gray-200 text-black hover:bg-gray-50"
      onClick={onClick}
    >
      End Session
    </Button>
  );
};

export default EndSessionButton;
