
import React, { useEffect, useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Phone } from "lucide-react";
import { RealtimeChat } from "@/utils/RealtimeAudio";
import { toast } from "@/hooks/use-toast";

interface VoiceChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VoiceChat: React.FC<VoiceChatProps> = ({ open, onOpenChange }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', text: string}>>([]);
  const chatRef = useRef<RealtimeChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Handle connection to voice API
  useEffect(() => {
    if (open && !chatRef.current) {
      connect();
    }
    
    return () => {
      if (chatRef.current) {
        chatRef.current.disconnect();
        chatRef.current = null;
      }
    };
  }, [open]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const connect = async () => {
    try {
      setIsConnecting(true);
      
      chatRef.current = new RealtimeChat((text) => {
        setTranscript(prev => prev + text);
      });
      
      await chatRef.current.connect();
      
      toast({
        title: "Voice chat active",
        description: "You can now speak with the AI assistant."
      });
    } catch (error) {
      console.error("Failed to start voice chat:", error);
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Could not connect to voice chat",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    if (chatRef.current) {
      chatRef.current.disconnect();
      chatRef.current = null;
    }
    setTranscript("");
    setMessages([]);
    onOpenChange(false);
  };

  const handleSendMessage = () => {
    if (!chatRef.current || !transcript.trim()) return;

    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', text: transcript }]);
    
    // Send the message
    chatRef.current.sendMessage(transcript);
    
    // Clear transcript for next input
    setTranscript("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone size={18} /> Voice Conversation
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 rounded-md my-4 min-h-[300px]">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-10">
              Speak naturally with the AI assistant or type a message below.
            </div>
          ) : (
            messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-4 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block px-4 py-2 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-500 text-white rounded-br-none' 
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))
          )}
          
          {transcript && (
            <div className="text-right mb-4">
              <div className="inline-block px-4 py-2 rounded-lg bg-blue-500 text-white rounded-br-none">
                {transcript}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Type a message..."
              className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <Button
            disabled={!transcript.trim()}
            onClick={handleSendMessage}
            size="sm"
          >
            Send
          </Button>
        </div>
        
        <DialogFooter>
          <div className="flex gap-2 items-center justify-between w-full">
            <div className="text-xs text-gray-500">
              {isConnecting 
                ? "Connecting to voice service..." 
                : chatRef.current?.isConnected 
                  ? "Voice service connected" 
                  : "Voice service disconnected"}
            </div>
            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm" onClick={handleClose}>
                  <X size={16} className="mr-1" /> Close
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VoiceChat;
