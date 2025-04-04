
import React from "react";
import { VoiceChatProvider } from "@/hooks/useVoiceChatContext";
import VoiceChatBody from "./VoiceChatBody";

interface VoiceChatProps {
  systemPrompt?: string;
  voice?: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
  onClose?: () => void;
}

/**
 * Main Voice Chat component that provides context and renders the UI
 */
const VoiceChat: React.FC<VoiceChatProps> = ({
  systemPrompt,
  voice = "alloy",
  onClose
}) => {
  return (
    <VoiceChatProvider 
      systemPrompt={systemPrompt} 
      voice={voice} 
      onClose={onClose}
    >
      <VoiceChatBody onClose={onClose} />
    </VoiceChatProvider>
  );
};

export default VoiceChat;
