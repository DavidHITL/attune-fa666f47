
import React, { useEffect, useRef } from "react";
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
    // This prevents fetchMessages from being called on every render
    if (!user) return;
    
    console.log("ChatConversation effect: User detected:", user.id);
    
    // Only fetch messages once per component mount
    if (!didInitialFetchRef.current) {
      console.log("ChatConversation: Performing initial message fetch");
      fetchMessages();
      didInitialFetchRef.current = true;
    }
  }, [user, fetchMessages]);

  // Reset the ref when user changes
  useEffect(() => {
    return () => {
      didInitialFetchRef.current = false;
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
