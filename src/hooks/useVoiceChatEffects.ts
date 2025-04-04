
import { UseVoiceChatEffectsProps } from "./voice/types";
import { useVoiceChatEffects as useEffects } from "./voice/useVoiceChatEffects";

/**
 * Hook to handle side effects for voice chat
 * Manages saving transcripts and cleanup on unmount
 */
export function useVoiceChatEffects(props: UseVoiceChatEffectsProps) {
  // Use the implementation from the dedicated hook file
  return useEffects(props);
}
