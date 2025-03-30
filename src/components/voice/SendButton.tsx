
import React from 'react';
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";

interface SendButtonProps {
  disabled: boolean;
  onClick: () => void;
}

const SendButton: React.FC<SendButtonProps> = ({ disabled, onClick }) => {
  return (
    <Button
      disabled={disabled}
      onClick={onClick}
      size="sm"
      type="button"
    >
      <Send size={18} />
    </Button>
  );
};

export default SendButton;
