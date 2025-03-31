
import React, { useEffect } from "react";
import NavBar from "@/components/NavBar";
import ChatInterface from "@/components/ChatInterface";
import SessionStartModal from "@/components/chat/SessionStartModal";
import EndSessionDialog from "@/components/chat/EndSessionDialog";
import ChatHeader from "@/components/chat/ChatHeader";
import { useSessionManager } from "@/hooks/useSessionManager";
import { fetchUserContext } from "@/services/contextEnrichmentService";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

const Chat: React.FC = () => {
  const {
    sessionStarted,
    sessionEndTime,
    showStartModal,
    setShowStartModal,
    showEndConfirmation,
    setShowEndConfirmation,
    startSession,
    handleRequestEndSession,
    confirmEndSession
  } = useSessionManager();
  
  const { user } = useAuth();

  // Fetch user context when session starts
  useEffect(() => {
    const prepareContext = async () => {
      if (sessionStarted && user?.id) {
        try {
          // Fetch context from previous sessions
          const context = await fetchUserContext(user.id);
          
          if (context) {
            console.log("Session started with context enrichment:", {
              messageCount: context.recentMessages.length,
              hasInstructions: !!context.userInstructions,
              hasKnowledgeEntries: !!context.knowledgeEntries
            });
            
            // Toast notification for better UX
            if (context.recentMessages.length > 0) {
              toast({
                title: "Previous conversation loaded",
                description: `Loaded ${context.recentMessages.length} messages from your conversation history.`,
                duration: 3000,
              });
            }
          }
        } catch (err) {
          console.error("Error preparing context for session:", err);
        }
      }
    };
    
    prepareContext();
  }, [sessionStarted, user]);

  // Convert sessionEndTime from number to Date if it exists
  const sessionEndTimeAsDate = sessionEndTime ? new Date(sessionEndTime) : null;

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      
      <ChatHeader 
        sessionStarted={sessionStarted}
        sessionEndTime={sessionEndTimeAsDate}
        onSessionComplete={confirmEndSession}
        onRequestEndSession={handleRequestEndSession}
      />
      
      <div className="relative flex-1 overflow-hidden bg-apple-gray-6">
        <div className="h-full overflow-auto pb-6">
          <ChatInterface 
            sessionStarted={sessionStarted}
            sessionEndTime={sessionEndTime}
          />
        </div>
      </div>
      
      {/* Session Modals */}
      <SessionStartModal 
        open={showStartModal && !sessionStarted}
        onOpenChange={setShowStartModal}
        onStartSession={startSession}
      />
      
      <EndSessionDialog 
        open={showEndConfirmation}
        onOpenChange={setShowEndConfirmation}
        onConfirmEnd={confirmEndSession}
      />
    </div>
  );
};

export default Chat;
