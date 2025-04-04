
import React, { useEffect, useRef, useState } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { calculateSessionProgress } from "@/utils/sessionUtils";
import DatabaseConnectionAlert from "./chat/DatabaseConnectionAlert";
import ChatLoadingState from "./chat/ChatLoadingState";
import { logContextVerification, trackModeTransition } from "@/services/context/unifiedContextProvider";

interface ChatConversationProps {
  isSpeechEnabled: boolean;
  sessionStarted?: boolean;
  sessionEndTime?: number | null;
}

const ChatConversation: React.FC<ChatConversationProps> = ({
  isSpeechEnabled,
  sessionStarted = false,
  sessionEndTime = null
}) => {
  const {
    user,
    isLoading: isAuthLoading
  } = useAuth();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const didInitialFetchRef = useRef(false);

  // Calculate session progress using the utility function
  const sessionProgress = calculateSessionProgress(sessionStarted, sessionEndTime);
  
  const {
    messages,
    setMessages,
    isLoading: isLoadingMessages,
    isInitialLoad,
    useLocalFallback,
    setUseLocalFallback,
    saveMessageToDatabase,
    fetchMessages,
    hasError
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
    isSpeechEnabled,
    sessionProgress
  });

  // Log that we're in text mode and track transitions
  useEffect(() => {
    if (user?.id && !isAuthLoading && initialLoadDone) {
      console.log("[ChatConversation] Active in text mode");
      
      // Track mode as text when component mounts
      trackModeTransition('voice', 'text', user.id).catch(console.error);
      
      // Log context verification for text mode
      logContextVerification({
        userId: user.id,
        activeMode: 'text',
        sessionStarted,
        sessionProgress
      }, undefined, {
        messageCount: messages.length
      }).catch(console.error);
    }
  }, [user?.id, isAuthLoading, initialLoadDone, messages.length, sessionStarted, sessionProgress]);

  // Log session progress for debugging
  useEffect(() => {
    if (sessionStarted) {
      console.log(`Current session progress: ${sessionProgress.toFixed(1)}%`);
    }
  }, [sessionProgress, sessionStarted]);

  // Function to retry database connection
  const handleRetryDatabaseConnection = () => {
    if (!user) return;
    console.log("Retrying database connection");
    setUseLocalFallback(false);
    didInitialFetchRef.current = false;
    fetchMessages();
  };

  // Watch for auth changes to automatically retry connection when user logs in
  useEffect(() => {
    if (user && useLocalFallback) {
      console.log("User is logged in but in local fallback mode. Attempting to reconnect to database...");
      // Small delay to ensure auth is fully established
      const timer = setTimeout(() => {
        handleRetryDatabaseConnection();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [user, useLocalFallback]);

  // Handle messages fetching
  useEffect(() => {
    // Don't attempt to fetch messages while auth state is still loading
    if (isAuthLoading) {
      console.log("Auth is still loading, waiting before fetching messages");
      return;
    }
    
    if (!user) {
      // If no user is logged in, just show the welcome message
      if (!initialLoadDone) {
        console.log("No user logged in, showing welcome message");
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

      // Add a slight delay to ensure auth is fully initialized
      setTimeout(() => {
        fetchMessages();
      }, 100);
    }
  }, [user, isAuthLoading, fetchMessages, setMessages, initialLoadDone]);

  // Reset the ref when user changes
  useEffect(() => {
    return () => {
      didInitialFetchRef.current = false;
      setInitialLoadDone(false);
    };
  }, [user?.id]);
  
  const isLoading = isLoadingMessages || isSendingMessage || isAuthLoading;

  // Show loading state
  if (isAuthLoading) {
    return <ChatLoadingState />;
  }
  
  return (
    <div className="flex flex-col h-full">
      {useLocalFallback && <DatabaseConnectionAlert onRetryConnection={handleRetryDatabaseConnection} />}
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        <ChatMessageList messages={messages} isLoading={isLoading} isInitialLoad={isInitialLoad} />
      </div>
      <div className="bg-apple-gray-6">
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatConversation;
