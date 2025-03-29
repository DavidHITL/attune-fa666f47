
import React, { useEffect, useRef, useState } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ChatConversationProps {
  isSpeechEnabled: boolean;
}

const ChatConversation: React.FC<ChatConversationProps> = ({ isSpeechEnabled }) => {
  const { user } = useAuth();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const didInitialFetchRef = useRef(false);
  
  const {
    messages,
    setMessages,
    isLoading: isLoadingMessages,
    isInitialLoad,
    useLocalFallback,
    setUseLocalFallback,
    saveMessageToDatabase,
    fetchMessages
  } = useChatMessages();

  const {
    isLoading: isSendingMessage,
    handleSendMessage
  } = useSendMessage({
    messages,
    setMessages,
    useLocalFallback,
    setUseLocalFallback,
    saveMessageToDatabase,
    isSpeechEnabled
  });

  // Fetch messages when the component mounts or user changes
  useEffect(() => {
    if (!user) {
      // If no user is logged in, just show the welcome message
      if (!initialLoadDone) {
        setMessages([{
          id: "welcome",
          text: "Hi there. How are you feeling today?",
          isUser: false,
          timestamp: new Date()
        }]);
        setInitialLoadDone(true);
      }
      return;
    }
    
    console.log("ChatConversation effect: User detected:", user.id);
    
    // Only fetch messages once per component mount
    if (!didInitialFetchRef.current) {
      console.log("ChatConversation: Performing initial message fetch");
      
      // Set a flag to prevent duplicate fetches
      didInitialFetchRef.current = true;
      
      // Fetch messages - the hook handles adding a welcome message if none exist
      fetchMessages();
    }
  }, [user, fetchMessages, setMessages, initialLoadDone]);

  // Reset the ref when user changes
  useEffect(() => {
    return () => {
      didInitialFetchRef.current = false;
      setInitialLoadDone(false);
    };
  }, [user?.id]);

  const isLoading = isLoadingMessages || isSendingMessage;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <ChatMessageList
          messages={messages}
          isLoading={isLoading}
          isInitialLoad={isInitialLoad}
        />
      </div>
      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatConversation;
