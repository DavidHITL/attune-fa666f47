
import { useEffect } from "react";
import { UseWebRTCConnectionOptions } from "../types";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";

export function useConnectionInitializer(
  options: UseWebRTCConnectionOptions,
  isConnected: boolean,
  isConnecting: boolean,
  connectorRef: React.MutableRefObject<WebRTCConnector | null>,
  prewarmMicrophoneAccess: () => Promise<boolean>
) {
  // Prewarm microphone access when autoConnect is enabled
  useEffect(() => {
    if (options.autoConnect && !isConnected && !isConnecting) {
      console.log("[useConnectionInitializer] Pre-warming microphone for auto-connect");
      prewarmMicrophoneAccess().catch(err => {
        console.warn("[useConnectionInitializer] Failed to pre-warm microphone:", err);
      });
    }
  }, [options.autoConnect, isConnected, isConnecting, prewarmMicrophoneAccess]);

  return null;
}
