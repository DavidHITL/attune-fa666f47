
import { useContext } from "react";
import { VoiceChatContext } from "./voice/VoiceChatProvider";

export { VoiceChatProvider } from "./voice/VoiceChatProvider";

/**
 * Hook to access the voice chat context
 */
export function useVoiceChatContext() {
  const context = useContext(VoiceChatContext);
  if (context === undefined) {
    throw new Error("useVoiceChatContext must be used within a VoiceChatProvider");
  }
  return context;
}
