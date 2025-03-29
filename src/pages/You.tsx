import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ChatSessionsCard from "@/components/dashboard/ChatSessionsCard";
import KeepInMindCard from "@/components/dashboard/KeepInMindCard";
import LosingStrategiesCard from "@/components/dashboard/LosingStrategiesCard";
import PartnerCard from "@/components/dashboard/PartnerCard";

// Interface for the profile data from users_profile table
interface UserProfileData {
  beingright_value: number | null;
  unbridledselfexpression_value: number | null;
  controlling_value: number | null;
  retaliation_value: number | null;
  withdrawal_value: number | null;
}

const You: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Fetch user profile data from Supabase
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('users_profile')
        .select('beingright_value, unbridledselfexpression_value, controlling_value, retaliation_value, withdrawal_value')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as UserProfileData;
    },
    enabled: !!user?.id,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar />
      <div className="flex-1 flex justify-center">
        <div className="max-w-4xl w-full py-8 px-4 flex flex-col space-y-6">
          <h1 className="text-2xl font-semibold mb-6 mt-4">Your Dashboard</h1>
          
          {/* Chat Sessions Left */}
          <div className="mt-2">
            <ChatSessionsCard />
          </div>
          
          {/* Keep in Mind */}
          <div className="mt-6">
            <KeepInMindCard isAuthenticated={!!user} />
          </div>
          
          {/* Losing Strategies */}
          <div className="mt-6">
            <LosingStrategiesCard profileData={profileData} />
          </div>
          
          {/* Partner */}
          <div className="mt-6">
            <PartnerCard />
          </div>
          
          {/* Sign Out */}
          <div className="mt-8 mb-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="text-apple-gray hover:text-apple-red hover:bg-apple-gray-6 flex items-center gap-2"
            >
              <LogOut size={18} />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
      <footer className="text-center py-3 text-xs text-gray-500 border-t border-gray-200">
        Attune<br />
        Napkin LLC — Zurich
      </footer>
    </div>
  );
};

export default You;
