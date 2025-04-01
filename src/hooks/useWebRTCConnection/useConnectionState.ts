
import { useState, useRef } from "react";
import { WebRTCConnector } from "@/utils/realtime/WebRTCConnector";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { AudioRecorder } from "@/utils/realtime/audio/AudioRecorder"; // Updated import path
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { WebRTCConnectionState, WebRTCMessage } from "./types";

export function useConnectionState(): WebRTCConnectionState & {
  connectorRef: React.MutableRefObject<WebRTCConnector | null>;
  recorderRef: React.MutableRefObject<AudioRecorder | null>;
  audioProcessorRef: React.MutableRefObject<AudioProcessor | null>;
  messageHandlerRef: React.MutableRefObject<WebRTCMessageHandler | null>;
  setMessages: React.Dispatch<React.SetStateAction<WebRTCMessage[]>>;
  setIsConnected: (isConnected: boolean) => void;
  setIsConnecting: (isConnecting: boolean) => void;
  setIsMicrophoneActive: (isMicrophoneActive: boolean) => void;
  setIsAiSpeaking: (isAiSpeaking: boolean) => void;
  setCurrentTranscript: (currentTranscript: string) => void;
} {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [messages, setMessages] = useState<WebRTCMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  // References to critical objects
  const connectorRef = useRef<WebRTCConnector | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  const messageHandlerRef = useRef<WebRTCMessageHandler | null>(null);

  return {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    currentTranscript,
    messages,
    
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
    setCurrentTranscript,
    setMessages
  };
}
