
import React, { useEffect } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface ChatSpeechProps {
  isSpeechEnabled: boolean;
  setIsSpeechEnabled: (enabled: boolean) => void;
}

const ChatSpeech: React.FC<ChatSpeechProps> = ({ 
  isSpeechEnabled, 
  setIsSpeechEnabled 
}) => {
  // Check if speech synthesis is available
  const speechAvailable = 'speechSynthesis' in window;

  // Toggle speech functionality
  const toggleSpeech = () => {
    if (!speechAvailable) {
      console.error("Speech synthesis is not supported in your browser.");
      return;
    }
    
    setIsSpeechEnabled(!isSpeechEnabled);
    
    // If enabling speech, load voices immediately for browsers that need it
    if (!isSpeechEnabled) {
      window.speechSynthesis.getVoices();
    }
  };

  useEffect(() => {
    // Preload voices when component mounts
    if (speechAvailable) {
      window.speechSynthesis.getVoices();
    }
  }, []);

  return (
    <div className="flex justify-end p-2">
      <button
        onClick={toggleSpeech}
        className={`p-2 rounded-full ${
          !speechAvailable ? 'opacity-50 cursor-not-allowed' : 
          isSpeechEnabled ? 'text-blue-600 hover:bg-blue-100' : 'text-gray-500 hover:bg-gray-100'
        }`}
        disabled={!speechAvailable}
        title={isSpeechEnabled ? "Disable voice feedback" : "Enable voice feedback"}
      >
        {isSpeechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
      </button>
    </div>
  );
};

export default ChatSpeech;

// Function to speak text using Web Speech API
export const speakMessage = (text: string, isSpeechEnabled: boolean): void => {
  const speechAvailable = 'speechSynthesis' in window;
  if (!speechAvailable || !isSpeechEnabled) return;
  
  // Stop any ongoing speech
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Set voice properties for a calm, friendly voice
  utterance.rate = 1.0; // Normal speaking rate
  utterance.pitch = 1.0; // Normal pitch
  utterance.volume = 1.0; // Full volume
  
  // Try to get a female voice in English
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(voice => 
    voice.name.includes('female') || 
    voice.name.includes('Female') || 
    voice.name.includes('woman') ||
    voice.name.includes('Samantha') ||
    voice.name.includes('Google UK English Female')
  );
  
  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }
  
  // Speak the message
  window.speechSynthesis.speak(utterance);
};
