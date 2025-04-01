
import { useCallback, useEffect } from "react";

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
  // Enhanced disconnect function with proper cleanup sequence
  const disconnect = useCallback(() => {
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
    return disconnect;
  }, [disconnect]);

  return {
    disconnect
  };
}
