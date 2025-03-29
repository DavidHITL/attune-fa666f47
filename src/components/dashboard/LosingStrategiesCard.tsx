
import React from "react";
import { Radar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import StrategyDataHandler from "./StrategyDataHandler";
import { UserProfileData, AnalysisResultData } from "@/utils/strategyUtils";

interface LosingStrategiesCardProps {
  profileData?: UserProfileData;
}

const LosingStrategiesCard: React.FC<LosingStrategiesCardProps> = ({ profileData }) => {
  const { user } = useAuth();
  
  // Fetch the latest analysis results if available
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['analysisResults', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error("Error fetching analysis results:", error);
        }
        return null;
      }
      
      return data as AnalysisResultData;
    },
    enabled: !!user?.id,
  });
  
  // Format the last updated date if available
  const getLastUpdated = () => {
    if (!analysisData?.timestamp) return null;
    
    try {
      const timestamp = new Date(analysisData.timestamp);
      return formatDistanceToNow(timestamp, { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return null;
    }
  };
  
  const lastUpdated = getLastUpdated();

  return (
    <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-apple-blue" />
          <CardTitle className="text-xl">Losing Strategies</CardTitle>
        </div>
        {lastUpdated && (
          <span className="text-xs text-muted-foreground">
            Last updated: {lastUpdated}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <StrategyDataHandler 
          profileData={profileData} 
          analysisData={analysisData} 
          isLoading={isLoading} 
        />
        
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            This visualization shows your tendency toward five losing strategies in communication.
            Lower scores indicate healthier communication patterns.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default LosingStrategiesCard;
