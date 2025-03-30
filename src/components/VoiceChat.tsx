
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import VoiceInputArea from "./VoiceInputArea";
import VoiceMessageList from "./VoiceMessageList";
import VoiceUIControls from "./voice/VoiceUIControls";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', text: string, timestamp?: Date}>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // For demo purposes, use the Web Speech API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;

  useEffect(() => {
    if (recognition) {
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          setTranscript(prevTranscript => prevTranscript + " " + transcript);
        } else {
          // Update with interim result
          setTranscript(prevTranscript => prevTranscript + " " + transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        toast.error("Error with speech recognition");
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          console.error("Error stopping recognition", error);
        }
      }
    };
  }, []);

  const startRecording = () => {
    if (recognition) {
      try {
        recognition.start();
        setIsRecording(true);
        toast.info("Listening...");
      } catch (error) {
        console.error("Error starting speech recognition", error);
        toast.error("Couldn't start speech recognition");
      }
    } else {
      toast.error("Speech recognition not supported in this browser");
    }
  };

  const stopRecording = () => {
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  // Save message to database
  const saveMessageToDatabase = async (text: string, isUser: boolean) => {
    try {
      if (!user) return;
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: text,
          user_id: user.id,
          sender_type: isUser ? 'user' : 'bot'
        })
        .select();
      
      if (error) {
        console.error("Error saving voice message to database:", error);
        throw error;
      }
      
      return data?.[0]?.id;
    } catch (error) {
      console.error("Failed to save voice message:", error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!transcript.trim()) return;

    const currentTranscript = transcript.trim();

    // Add user message to chat
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: currentTranscript, 
      timestamp: new Date() 
    }]);
    
    // Save user message to database
    await saveMessageToDatabase(currentTranscript, true);
    
    // Clear transcript for next input
    setTranscript("");

    // Simulate AI response (in a real app, you'd call an API here)
    setIsProcessing(true);

    // For demo purposes, we'll just echo back the user's message with a delay
    setTimeout(async () => {
      const aiResponse = `I received your message: "${currentTranscript}". This is a simulated response since the realtime chat feature is currently being rebuilt.`;
      
      // Add AI response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: aiResponse,
        timestamp: new Date()
      }]);

      // Save AI message to database
      await saveMessageToDatabase(aiResponse, false);
      
      setIsProcessing(false);
    }, 1500);
  };

  const handleClose = () => {
    stopRecording();
    setTranscript("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>Voice Chat</DialogTitle>
          <DialogDescription>
            Speak with the AI using your microphone
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col h-[60vh]">
          <VoiceMessageList 
            messages={messages} 
            transcript={transcript} 
          />
          
          <VoiceInputArea
            transcript={transcript}
            setTranscript={setTranscript}
            onSend={sendMessage}
            isRecording={isRecording}
            startRecording={recognition ? startRecording : undefined}
            stopRecording={recognition ? stopRecording : undefined}
          />
        </div>
        
        <VoiceUIControls 
          isConnecting={isProcessing}
          connectionStatus={isProcessing ? 'connecting' : 'connected'}
        />
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
