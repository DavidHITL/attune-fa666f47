
import React from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";

interface ChatConversationProps {
  isSpeechEnabled: boolean;
}

const ChatConversation: React.FC<ChatConversationProps> = ({ isSpeechEnabled }) => {
  const {
    messages,
    setMessages,
    isLoading: isLoadingMessages,
    isInitialLoad,
    useLocalFallback,
    setUseLocalFallback,
    saveMessageToDatabase
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
