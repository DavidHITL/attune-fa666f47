
import { useState, useRef } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { WebRTCMessage } from "./types";

/**
 * Hook to manage WebRTC connection state
 */
export function useConnectionState() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  
  // Technical refs
  const connectorRef = useRef<WebRTCConnector | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const messageHandlerRef = useRef<WebRTCMessageHandler | null>(null);

  return {
    // State
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    currentTranscript,
    
    // Refs
    connectorRef,
    recorderRef,
    audioProcessorRef,
    messageHandlerRef,
    
    // Setters
    setIsConnected,
    setIsConnecting,
    setIsMicrophoneActive,
    setIsAiSpeaking,
    setCurrentTranscript
  };
}
