
import React, { useEffect } from "react";
import { toast } from "sonner";
import { AudioSender } from "@/utils/realtime/connector/AudioSender";

interface VoiceChatAudioProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  getActiveMediaStream: () => MediaStream | null;
}

const VoiceChatAudio: React.FC<VoiceChatAudioProps> = ({ 
  audioRef, 
  getActiveMediaStream 
}) => {
  // Handle web audio track events for playback
  const handleTrackEvent = (event: RTCTrackEvent) => {
    // Handle incoming audio track
    if (event.track.kind === 'audio' && event.streams && event.streams.length > 0) {
      console.log("[VoiceChatAudio] Received audio track from WebRTC, connecting to audio element");
      
      // Mark that audio is being sent whenever we receive a track
      AudioSender.markAudioSent();
      
      if (audioRef.current) {
        audioRef.current.srcObject = event.streams[0];
        
        audioRef.current.onloadedmetadata = () => {
          console.log("[VoiceChatAudio] Audio metadata loaded, attempting playback");
          audioRef.current?.play()
            .then(() => console.log("[VoiceChatAudio] Audio playback started"))
            .catch(err => {
              console.error("[VoiceChatAudio] Audio playback failed:", err);
              toast.error("Audio playback failed. Please check your audio settings.");
            });
        };
      }
    }
  };

  // Ensure audio context is resumed after user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (audioRef.current && audioRef.current.paused) {
        console.log("[VoiceChatAudio] User interaction detected, attempting to resume audio context");
        audioRef.current.play()
          .catch(err => console.log("[VoiceChatAudio] Could not auto-play audio after interaction:", err));
      }
    };

    // Add interaction listeners
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [audioRef]);

  return (
    <audio 
      ref={audioRef} 
      autoPlay 
      playsInline
      style={{ display: 'none' }}
      id="voice-chat-audio"
    />
  );
};

export default VoiceChatAudio;
