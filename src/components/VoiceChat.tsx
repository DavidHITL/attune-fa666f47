
import React, { useState, useEffect, useRef } from "react";
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

  // Speech recognition setup
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    console.log("[VoiceChat] Initializing speech recognition");
    
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event) => {
          const current = event.resultIndex;
          const result = event.results[current];
          const transcript = result[0].transcript;
          
          console.log("[VoiceChat] Speech recognition result:", transcript);
          
          if (result.isFinal) {
            setTranscript(prevTranscript => prevTranscript + " " + transcript);
          } else {
            // Update with interim result
            setTranscript(prevTranscript => prevTranscript + " " + transcript);
          }
        };

        recognition.onerror = (event) => {
          console.error("[VoiceChat] Speech recognition error", event.error);
          setIsRecording(false);
          toast.error("Error with speech recognition: " + event.error);
        };

        recognition.onend = () => {
          console.log("[VoiceChat] Speech recognition ended");
          setIsRecording(false);
        };
      } else {
        console.warn("[VoiceChat] Speech recognition not supported in this browser");
      }
    }

    return () => {
      if (recognitionRef.current) {
        console.log("[VoiceChat] Cleaning up speech recognition");
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("[VoiceChat] Error stopping recognition", error);
        }
      }
    };
  }, [open]);

  // Load previous messages when opened
  useEffect(() => {
    if (open && user) {
      console.log("[VoiceChat] Dialog opened, loading messages");
      loadMessages();
    }
  }, [open, user]);

  const loadMessages = async () => {
    try {
      if (!user) return;
      
      console.log("[VoiceChat] Loading messages for user:", user.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (error) {
        console.error("[VoiceChat] Error loading messages:", error);
        toast.error("Failed to load messages");
        return;
      }
      
      console.log("[VoiceChat] Loaded messages:", data?.length || 0);
      
      if (data && data.length > 0) {
        const formattedMessages = data.map(msg => ({
          role: msg.sender_type === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
          text: msg.content || '',
          timestamp: new Date(msg.created_at)
        }));
        
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error("[VoiceChat] Error in loadMessages:", error);
      toast.error("Failed to load messages");
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      try {
        console.log("[VoiceChat] Starting speech recognition");
        recognitionRef.current.start();
        setIsRecording(true);
        toast.info("Listening...");
      } catch (error) {
        console.error("[VoiceChat] Error starting speech recognition", error);
        toast.error("Couldn't start speech recognition");
      }
    } else {
      toast.error("Speech recognition not supported in this browser");
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      console.log("[VoiceChat] Stopping speech recognition");
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Save message to database
  const saveMessageToDatabase = async (text: string, isUser: boolean) => {
    try {
      if (!user) return;
      
      console.log("[VoiceChat] Saving message to database:", isUser ? "user" : "assistant");
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content: text,
          user_id: user.id,
          sender_type: isUser ? 'user' : 'bot'
        })
        .select();
      
      if (error) {
        console.error("[VoiceChat] Error saving message to database:", error);
        throw error;
      }
      
      console.log("[VoiceChat] Message saved successfully:", data?.[0]?.id);
      return data?.[0]?.id;
    } catch (error) {
      console.error("[VoiceChat] Failed to save message:", error);
      return null;
    }
  };

  const sendMessage = async () => {
    if (!transcript.trim()) {
      console.log("[VoiceChat] No transcript to send");
      return;
    }

    const currentTranscript = transcript.trim();
    console.log("[VoiceChat] Sending message:", currentTranscript);

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
      
      console.log("[VoiceChat] Simulated AI response:", aiResponse);
      
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

  const handleAudioData = (audioData: Float32Array) => {
    // This function would normally process audio data
    // For now it's just a placeholder
    console.log("[VoiceChat] Received audio data, length:", audioData.length);
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
            startRecording={startRecording}
            stopRecording={stopRecording}
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
