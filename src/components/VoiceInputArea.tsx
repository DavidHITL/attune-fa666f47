
import React from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface VoiceInputAreaProps {
  transcript: string;
  setTranscript: (transcript: string) => void;
  onSend: () => void;
}

const VoiceInputArea: React.FC<VoiceInputAreaProps> = ({ 
  transcript, 
  setTranscript, 
  onSend 
}) => {
  // Function to check if the user's message count has reached the threshold
  const checkMessageAnalysisThreshold = async (userId: string) => {
    try {
      // Get the current user's profile to check message count
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('message_count')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        return;
      }

      // If message count is 19 (will become 20 with this message)
      // No toast notification is shown anymore
    } catch (error) {
      console.error("Error checking message threshold:", error);
    }
  };

  const handleSend = async () => {
    // Check if the user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Check message count before sending
      await checkMessageAnalysisThreshold(user.id);
    }
    
    // Call the original onSend function
    onSend();
  };

  return (
    <div className="flex gap-3 p-2 bg-apple-gray-6">
      <div className="flex-1 relative">
        <input
          type="text"
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Type a message..."
          className="w-full rounded-md border border-gray-300 py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>
      <Button
        disabled={!transcript.trim()}
        onClick={handleSend}
        size="sm"
      >
        Send
      </Button>
    </div>
  );
};

export default VoiceInputArea;
