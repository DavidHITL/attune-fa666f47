
import { useEffect } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { UseWebRTCConnectionOptions } from "../types";

/**
 * Initialize connection based on options
 */
export function useConnectionInitializer(
  options: UseWebRTCConnectionOptions,
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  prewarmMicrophoneAccess: () => Promise<void>
) {
  // Auto-connect if enabled or prewarm microphone
  useEffect(() => {
    if (options.autoConnect && !isConnected && !isConnecting && connectorRef.current) {
      console.log("[useConnectionInitializer] Auto-connecting due to autoConnect option");
      connectorRef.current.connect();
    } else if (options.enableMicrophone && !isConnected && !isConnecting) {
      // If not auto-connecting but microphone is enabled, prewarm microphone access
      console.log("[useConnectionInitializer] Prewarming microphone access");
      prewarmMicrophoneAccess();
    }
  }, [
    options.autoConnect,
    options.enableMicrophone,
    isConnected,
    isConnecting,
    connectorRef,
    prewarmMicrophoneAccess
  ]);
}
