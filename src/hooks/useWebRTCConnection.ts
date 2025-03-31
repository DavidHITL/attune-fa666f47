
import { useState, useEffect, useCallback, useRef } from "react";
import { WebRTCConnector, WebRTCOptions } from "@/utils/realtime/WebRTCConnector";
import { AudioRecorder } from "@/utils/realtime/AudioRecorder";
import { toast } from "sonner";

export interface UseWebRTCConnectionOptions extends WebRTCOptions {
  autoConnect?: boolean;
  enableMicrophone?: boolean;
}

export interface WebRTCMessage {
  type: string;
  [key: string]: any;
}

export function useWebRTCConnection(options: UseWebRTCConnectionOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMicrophoneActive, setIsMicrophoneActive] = useState(false);
  const [messages, setMessages] = useState<WebRTCMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  
  const connectorRef = useRef<WebRTCConnector | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<Uint8Array[]>([]);
  const isPlayingRef = useRef<boolean>(false);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.autoplay = false;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // Handle incoming WebRTC messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      
      // Add to messages for debugging/display
      setMessages(prev => [...prev, message]);
      
      // Handle different message types
      if (message.type === "response.audio.delta") {
        // Handle incoming audio data
        handleAudioDelta(message.delta);
        setIsAiSpeaking(true);
      } 
      else if (message.type === "response.audio.done") {
        // AI has finished speaking
        setIsAiSpeaking(false);
      }
      else if (message.type === "response.audio_transcript.delta") {
        // Update transcript with new text
        setCurrentTranscript(prev => prev + (message.delta || ""));
      } 
      else if (message.type === "response.audio_transcript.done") {
        // Transcript is complete, reset for next response
        setTimeout(() => setCurrentTranscript(""), 1000);
      }
    } catch (error) {
      console.error("[useWebRTCConnection] Error handling message:", error);
    }
  }, []);

  // Convert base64 audio data to playable format
  const handleAudioDelta = useCallback((base64Audio: string) => {
    try {
      // Convert base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Add to audio queue
      audioQueueRef.current.push(bytes);
      
      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextAudioChunk();
      }
    } catch (error) {
      console.error("[useWebRTCConnection] Error processing audio:", error);
    }
  }, []);

  // Play audio chunks sequentially
  const playNextAudioChunk = useCallback(async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioData = audioQueueRef.current.shift()!;

    try {
      // Convert PCM audio to WAV format
      const wavData = createWavFromPCM(audioData);
      
      // Create blob URL for the audio element
      const blob = new Blob([wavData], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        // Set up event listener for when playback ends
        const handleEnded = () => {
          URL.revokeObjectURL(url);
          audioRef.current?.removeEventListener('ended', handleEnded);
          playNextAudioChunk();
        };
        
        audioRef.current.addEventListener('ended', handleEnded);
        audioRef.current.src = url;
        audioRef.current.play().catch(err => {
          console.error("[useWebRTCConnection] Error playing audio:", err);
          handleEnded(); // Continue with next chunk even if this one fails
        });
      }
    } catch (error) {
      console.error("[useWebRTCConnection] Error playing audio chunk:", error);
      // Continue with next chunk even if this one fails
      playNextAudioChunk();
    }
  }, []);

  // Create WAV format from PCM data
  const createWavFromPCM = useCallback((pcmData: Uint8Array) => {
    // PCM data is 16-bit samples, little-endian
    const numSamples = pcmData.length / 2;
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;
    
    // Create buffer for WAV header + data
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk
    writeString(view, 0, "RIFF");
    view.setUint32(4, fileSize, true);
    writeString(view, 8, "WAVE");
    
    // "fmt " chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" chunk
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
    
    // Copy PCM data
    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(pcmData);
    
    return new Uint8Array(buffer);
  }, []);

  // Helper function to write strings to DataView
  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Connect to OpenAI Realtime API
  const connect = useCallback(async () => {
    if (isConnected || isConnecting) return false;
    
    try {
      setIsConnecting(true);
      
      // Create a new WebRTC connector
      const connector = new WebRTCConnector({
        ...options,
        onMessage: handleMessage,
        onConnectionStateChange: (state) => {
          setIsConnected(state === "connected");
          if (state === "failed" || state === "disconnected") {
            toast.error("WebRTC connection lost. Please reconnect.");
            disconnect();
          }
        },
        onError: (error) => {
          toast.error(`WebRTC error: ${error.message}`);
        }
      });
      
      connectorRef.current = connector;
      
      // Attempt to connect
      const success = await connector.connect();
      
      if (success) {
        setIsConnected(true);
        toast.success("Connected to OpenAI Realtime API");
        
        // Start microphone if enabled
        if (options.enableMicrophone) {
          await toggleMicrophone();
        }
      } else {
        toast.error("Failed to connect to OpenAI Realtime API");
        connectorRef.current = null;
      }
      
      setIsConnecting(false);
      return success;
    } catch (error) {
      console.error("[useWebRTCConnection] Connection error:", error);
      toast.error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
      setIsConnecting(false);
      return false;
    }
  }, [handleMessage, isConnected, isConnecting, options, toggleMicrophone]);

  // Disconnect from OpenAI Realtime API
  const disconnect = useCallback(() => {
    // Stop microphone if active
    if (recorderRef.current) {
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
    }
    
    // Disconnect WebRTC
    if (connectorRef.current) {
      connectorRef.current.disconnect();
      connectorRef.current = null;
    }
    
    // Reset state
    setIsConnected(false);
    setCurrentTranscript("");
    setIsAiSpeaking(false);
    setMessages([]);
    
    // Clear audio queue
    audioQueueRef.current = [];
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    isPlayingRef.current = false;
  }, []);

  // Toggle microphone on/off
  const toggleMicrophone = useCallback(async () => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    if (isMicrophoneActive && recorderRef.current) {
      // Stop recording
      recorderRef.current.stop();
      recorderRef.current = null;
      setIsMicrophoneActive(false);
      return true;
    } else {
      // Start recording
      try {
        const recorder = new AudioRecorder({
          onAudioData: (audioData) => {
            // Send audio data if connection is active
            if (connectorRef.current) {
              connectorRef.current.sendAudioData(audioData);
            }
          }
        });
        
        const success = await recorder.start();
        
        if (success) {
          recorderRef.current = recorder;
          setIsMicrophoneActive(true);
          return true;
        } else {
          toast.error("Failed to start microphone");
          return false;
        }
      } catch (error) {
        console.error("[useWebRTCConnection] Microphone error:", error);
        toast.error(`Microphone error: ${error instanceof Error ? error.message : String(error)}`);
        return false;
      }
    }
  }, [isConnected, isMicrophoneActive]);

  // Send text message to OpenAI
  const sendTextMessage = useCallback((text: string) => {
    if (!isConnected || !connectorRef.current) {
      toast.error("Please connect to OpenAI first");
      return false;
    }
    
    try {
      return connectorRef.current.sendTextMessage(text);
    } catch (error) {
      console.error("[useWebRTCConnection] Error sending message:", error);
      toast.error(`Error sending message: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }, [isConnected]);

  // Auto-connect if enabled
  useEffect(() => {
    if (options.autoConnect && !isConnected && !isConnecting) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect, isConnected, isConnecting, options.autoConnect]);

  return {
    isConnected,
    isConnecting,
    isMicrophoneActive,
    isAiSpeaking,
    currentTranscript,
    messages,
    connect,
    disconnect,
    toggleMicrophone,
    sendTextMessage
  };
}
