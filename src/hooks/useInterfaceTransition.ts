
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { trackModeTransition } from "@/services/context/contextVerification";
import { getRecentContextSummary } from "@/services/context/contextSummary";
import { toast } from "sonner";

interface UseInterfaceTransitionProps {
  currentMode: 'text' | 'voice';
  onModeChange?: (mode: 'text' | 'voice') => void;
}

export function useInterfaceTransition({ 
  currentMode, 
  onModeChange 
}: UseInterfaceTransitionProps) {
  const [previousMode, setPreviousMode] = useState<'text' | 'voice' | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contextSummary, setContextSummary] = useState<string | null>(null);
  const { user } = useAuth();
  
  // Track mode transitions
  useEffect(() => {
    // Only track when there's an actual transition between modes
    if (previousMode && previousMode !== currentMode) {
      setIsTransitioning(true);
      
      // Track the transition for context preservation
      trackModeTransition(previousMode, currentMode, user?.id)
        .then(() => {
          console.log(`[useInterfaceTransition] Transition from ${previousMode} to ${currentMode} tracked`);
          
          // Show toast notification for better UX
          toast.success(`Switched to ${currentMode} interface`, {
            description: "Your conversation context has been preserved",
            duration: 3000
          });
          
          // Get summary of recent context for verification
          return getRecentContextSummary(user?.id);
        })
        .then(summary => {
          if (summary) {
            console.log("[useInterfaceTransition] Context summary:", summary);
            setContextSummary(summary);
          }
          setIsTransitioning(false);
        })
        .catch(error => {
          console.error("[useInterfaceTransition] Error tracking mode transition:", error);
          setIsTransitioning(false);
        });
    }
    
    // Update previous mode for next comparison
    setPreviousMode(currentMode);
  }, [currentMode, previousMode, user?.id]);
  
  // Handle manual mode changes
  const changeMode = useCallback((newMode: 'text' | 'voice') => {
    if (newMode !== currentMode) {
      console.log(`[useInterfaceTransition] Requesting mode change to ${newMode}`);
      
      // Notify parent component about mode change
      if (onModeChange) {
        onModeChange(newMode);
      }
    }
  }, [currentMode, onModeChange]);
  
  return {
    currentMode,
    previousMode,
    isTransitioning,
    contextSummary,
    changeMode
  };
}
