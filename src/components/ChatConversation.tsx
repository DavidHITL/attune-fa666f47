
import React, { useEffect, useRef, useState } from "react";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useSendMessage } from "@/hooks/useSendMessage";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DatabaseIcon, AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const { user, isLoading: isAuthLoading } = useAuth();
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const didInitialFetchRef = useRef(false);
  
  // Calculate session progress (0-100%)
  const calculateSessionProgress = () => {
    if (!sessionStarted || !sessionEndTime) return 0;
    
    const now = Date.now();
    const sessionDuration = 25 * 60 * 1000; // 25 minutes in ms
    const sessionStartTime = sessionEndTime - sessionDuration;
    const elapsed = now - sessionStartTime;
    
    // Return percentage of session completed (0-100)
    return Math.min(100, Math.max(0, (elapsed / sessionDuration) * 100));
  };
  
  const sessionProgress = calculateSessionProgress();
  
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
    sessionProgress // Pass session progress to useSendMessage
  });

  // Log session progress for debugging
  useEffect(() => {
    if (sessionStarted) {
      console.log(`Current session progress: ${sessionProgress.toFixed(1)}%`);
    }
  }, [sessionProgress, sessionStarted]);

  // Function to retry database connection
  const handleRetryDatabaseConnection = () => {
    if (!user) return;
    
    toast({
      title: "Retrying database connection",
      description: "Attempting to reconnect to the database...",
    });
    
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

  // Fetch messages when component mounts or user changes
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

  // Show appropriate error or loading state
  if (isAuthLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center">
        <div className="text-center p-4">
          <div className="spinner mb-4">Loading...</div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {useLocalFallback && (
        <Alert variant="destructive" className="m-4">
          <DatabaseIcon className="h-4 w-4 mr-2" />
          <div className="flex-1">
            <AlertTitle>Database Connection Issue</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <p>Unable to save messages to the database due to permissions. Your messages will be stored locally only for this session.</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                <AlertTriangleIcon className="h-3 w-3" />
                <span>Note: These messages will be lost when you close your browser.</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                className="mt-2 self-start flex items-center gap-2"
                onClick={handleRetryDatabaseConnection}
              >
                <RefreshCwIcon className="h-3 w-3" /> 
                Retry Database Connection
              </Button>
            </AlertDescription>
          </div>
        </Alert>
      )}
      
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
