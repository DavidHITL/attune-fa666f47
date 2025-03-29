
import React, { useEffect } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useAuth } from "@/context/AuthContext";

interface ChatConversationProps {
  isSpeechEnabled: boolean;
}

const ChatConversation: React.FC<ChatConversationProps> = ({ isSpeechEnabled }) => {
  const { user } = useAuth();
  
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

  // This effect ensures we refresh messages when the component mounts
  // or when the user changes, which is crucial for persistence across navigations
  useEffect(() => {
    console.log("ChatConversation mounted, user:", user?.id);
    if (user && messages.length === 0) {
      console.log("No messages in state, fetching messages...");
      fetchMessages();
    }
  }, [user, messages.length, fetchMessages]);

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
