
import { useCallback, useEffect, useRef } from "react";

export function useDisconnection(
  connectorRef: React.MutableRefObject<any>,
  recorderRef: React.MutableRefObject<any>,
  audioProcessorRef: React.MutableRefObject<any>,
  setIsConnected: (isConnected: boolean) => void,
  setIsConnecting: (isConnecting: boolean) => void,
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void,
  setIsAiSpeaking: (isAiSpeaking: boolean) => void
) {
  // Flag to track if disconnection is in progress
  const isDisconnectingRef = useRef(false);

  // Enhanced disconnect function with proper cleanup sequence
  const disconnect = useCallback(() => {
    // Prevent duplicate disconnect calls
    if (isDisconnectingRef.current) {
      console.log("[useDisconnection] Disconnection already in progress, ignoring duplicate call");
      return;
    }
    
    isDisconnectingRef.current = true;
    console.log("[useDisconnection] Starting disconnection sequence");
    
    // Stop microphone if active
    if (recorderRef.current) {
      console.log("[useDisconnection] Stopping microphone");
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
    }
    
    // Disconnect WebRTC
    if (connectorRef.current) {
      console.log("[useDisconnection] Disconnecting WebRTC connector");
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setIsConnecting(false);
    setCurrentTranscript("");
    setIsAiSpeaking(false);
    
    // Clean up audio processor
    if (audioProcessorRef.current) {
      console.log("[useDisconnection] Cleaning up audio processor");
      audioProcessorRef.current.cleanup();
    }
    
    console.log("[useDisconnection] Disconnect complete");
    
    // Reset disconnecting flag after a short delay to avoid race conditions
    setTimeout(() => {
      isDisconnectingRef.current = false;
    }, 500);
  }, [
    setIsConnected, 
    setIsConnecting, 
    setCurrentTranscript, 
    setIsAiSpeaking, 
    setIsMicrophoneActive, 
    audioProcessorRef, 
    connectorRef, 
    recorderRef
  ]);

  // Ensure we clean up on unmount
  useEffect(() => {
    return () => {
      if (!isDisconnectingRef.current) {
        console.log("[useDisconnection] Component unmounting, cleaning up resources");
        disconnect();
      }
    };
  }, [disconnect]);

  return {
    disconnect,
    isDisconnecting: isDisconnectingRef.current
  };
}
