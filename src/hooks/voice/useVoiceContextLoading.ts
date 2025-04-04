
import { useEffect } from "react";
import { useContextLoader } from "./useContextLoader";

/**
 * Hook to handle loading user context before establishing connection
 */
export function useVoiceContextLoading(userId?: string) {
  const {
    contextLoaded,
    contextLoadError,
    loadContextWithTimeout
  } = useContextLoader(userId);

  // Pre-load user context before connection
  useEffect(() => {
    if (!contextLoaded) {
      loadContextWithTimeout();
    }
  }, [contextLoaded, loadContextWithTimeout]);

  return {
    contextLoaded,
    contextLoadError,
    loadContextWithTimeout
  };
}
