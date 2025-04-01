import { useEffect, useRef, useState, useCallback } from "react";
import { AudioProcessor } from "@/utils/realtime/AudioProcessor";
import { WebRTCMessageHandler } from "@/utils/realtime/WebRTCMessageHandler";
import { WebRTCMessage } from "./types";
import { saveMessage } from "@/services/messages/messageStorage";
import { useAuth } from "@/context/AuthContext";

export function useAudioProcessor(
  setIsAiSpeaking: (isAiSpeaking: boolean) => void,
  setCurrentTranscript: (currentTranscript: string) => void
): {
  audioProcessor: AudioProcessor;
  messageHandler: WebRTCMessageHandler;
  isProcessingAudio: boolean;
  transcriptProgress: number;
} {
  // Initialize state
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [transcriptProgress, setTranscriptProgress] = useState(0);
  const lastAudioTimestampRef = useRef<number>(0);
  const { user } = useAuth();
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  
  // Create audio element for WebRTC stream playback
  useEffect(() => {
    if (!audioElementRef.current) {
      const audioEl = new Audio();
      audioEl.autoplay = true;
      audioEl.muted = false;
      audioEl.volume = 1.0;
      
      // Attach to DOM to help with autoplay policies
      document.body.appendChild(audioEl);
      audioEl.style.display = 'none';
      
      // Store reference
      audioElementRef.current = audioEl;
      
      console.log("[useAudioProcessor] Created audio element for WebRTC stream playback");
    }
    
    // Cleanup on unmount
    return () => {
      if (audioElementRef.current && audioElementRef.current.parentNode) {
        audioElementRef.current.pause();
        audioElementRef.current.srcObject = null;
        audioElementRef.current.parentNode.removeChild(audioElementRef.current);
        audioElementRef.current = null;
        console.log("[useAudioProcessor] Removed audio element");
      }
    };
  }, []);
  
  // Initialize audio processor (keeping for backward compatibility)
  const audioProcessorRef = useRef<AudioProcessor | null>(null);
  if (!audioProcessorRef.current) {
    audioProcessorRef.current = new AudioProcessor();
  }
  const audioProcessor = audioProcessorRef.current;

  // Handle saving complete voice transcript
  const handleTranscriptComplete = useCallback((transcript: string) => {
    if (!transcript.trim() || !user) return;
    
    // Save the transcript as a voice message
    saveMessage(transcript, false, { 
      messageType: 'voice',
    }).catch(error => {
      console.error("[AudioProcessor] Failed to save voice transcript:", error);
    });
  }, [user]);
  
  // Initialize message handler with callbacks
  const messageHandler = new WebRTCMessageHandler({
    onAudioData: (base64Audio) => {
      // We'll still add audio data to processor for backward compatibility
      // but primary playback will come from WebRTC media track
      audioProcessor.addAudioData(base64Audio);
      setIsProcessingAudio(true);
      setIsAiSpeaking(true);
      
      // Update last audio timestamp
      lastAudioTimestampRef.current = Date.now();
    },
    onAudioComplete: () => {
      // Signal that AI has stopped speaking
      console.log("[useAudioProcessor] Audio complete signal received");
      
      setIsAiSpeaking(false);
      // Give a short delay before considering processing complete
      setTimeout(() => {
        setIsProcessingAudio(false);
      }, 500);
    },
    onTranscriptUpdate: (fullTranscript) => {
      setCurrentTranscript(fullTranscript);
      
      // Update progress based on time since last audio chunk
      const now = Date.now();
      if (now - lastAudioTimestampRef.current > 2000) {
        setTranscriptProgress(100);
      } else {
        // Estimate progress based on time since last audio
        const progress = Math.min(100, Math.max(0, 
          (now - lastAudioTimestampRef.current) / 20));
        setTranscriptProgress(progress);
      }
    },
    onTranscriptComplete: () => {
      setTranscriptProgress(100);
      setTimeout(() => {
        setCurrentTranscript("");
        setTranscriptProgress(0);
      }, 1000);
    },
    onFinalTranscript: handleTranscriptComplete,
    onMessageReceived: (message: WebRTCMessage) => {
      // Additional message handling can be added here
      if (message.type === 'response.created') {
        console.log("[AudioProcessor] Response started");
        setTranscriptProgress(0);
      }
    }
  });

  // Method to set the media stream for the audio element
  const setAudioStream = useCallback((stream: MediaStream) => {
    if (audioElementRef.current) {
      console.log("[useAudioProcessor] Setting audio element srcObject to incoming media stream");
      audioElementRef.current.srcObject = stream;
      
      // Ensure audio is not muted
      audioElementRef.current.muted = false;
      
      // Handle autoplay restrictions
      audioElementRef.current.play()
        .then(() => {
          console.log("[useAudioProcessor] Audio playback started automatically");
        })
        .catch(err => {
          console.warn("[useAudioProcessor] Autoplay prevented. Error:", err);
          // Set up event listener for user interaction to start playback
          const handleUserInteraction = () => {
            if (audioElementRef.current) {
              audioElementRef.current.play()
                .then(() => {
                  console.log("[useAudioProcessor] Audio playback started after user interaction");
                })
                .catch(playError => {
                  console.error("[useAudioProcessor] Failed to play audio after interaction:", playError);
                });
            }
            
            // Remove the event listeners after first interaction
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
          };
          
          document.addEventListener('click', handleUserInteraction);
          document.addEventListener('touchstart', handleUserInteraction);
        });
    }
  }, []);

  // Resume audio context on first user interaction (for backward compatibility)
  useEffect(() => {
    const handleUserInteraction = () => {
      // Resume audio context if it exists
      if (audioProcessor) {
        audioProcessor.addAudioData("").catch(error => {
          console.error("[AudioProcessor] Error resuming audio context:", error);
        });
      }
      
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioProcessor]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioProcessorRef.current) {
        audioProcessorRef.current.cleanup();
      }
    };
  }, []);

  // Expose setAudioStream through audioProcessor for compatibility
  audioProcessor.setAudioStream = setAudioStream;

  return { 
    audioProcessor, 
    messageHandler, 
    isProcessingAudio,
    transcriptProgress 
  };
}
