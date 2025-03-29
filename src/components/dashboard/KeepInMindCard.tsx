
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { AnalysisResultData, formatInsightData } from "@/utils/insightUtils";
import InsightItem from "./InsightItem";
import SummarySection from "./SummarySection";
import NoDataAlert from "./NoDataAlert";

interface KeepInMindCardProps {
  isAuthenticated: boolean;
}

const KeepInMindCard: React.FC<KeepInMindCardProps> = ({ isAuthenticated }) => {
  const { user } = useAuth();
  
  // Fetch the latest analysis results if available
  const { data: analysisData, isLoading } = useQuery({
    queryKey: ['analysisResults', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('analysis_results')
        .select('id, user_id, timestamp, summary_text, keywords')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching analysis results:", error);
        return null;
      }
      
      return data as AnalysisResultData;
    },
    enabled: !!user?.id && isAuthenticated,
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
  
  // Prepare insights from keywords
  const insights = formatInsightData(analysisData?.keywords);
  const hasData = analysisData?.summary_text || insights.length > 0;

  return (
    <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">Keep in Mind</CardTitle>
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Last updated: {lastUpdated}
            </span>
          )}
        </div>
        <CardDescription>Key insights from your conversations</CardDescription>
      </CardHeader>
      <CardContent>
        {isAuthenticated ? (
          <>
            {!hasData && !isLoading ? (
              <NoDataAlert />
            ) : (
              <div className="space-y-4">
                {insights.length > 0 && insights.map((keyword, index) => (
                  <InsightItem 
                    key={index} 
                    keyword={keyword} 
                    index={index}
                    isLast={index === insights.length - 1} 
                  />
                ))}
                
                {analysisData?.summary_text && (
                  <>
                    {insights.length > 0 && <Separator />}
                    <SummarySection summaryText={analysisData.summary_text} />
                  </>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-muted-foreground italic">We need to talk before we can be sure about your most important challenges.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default KeepInMindCard;
