
import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface AnalysisResultData {
  id: string;
  user_id: string;
  timestamp: string;
  summary_text: string | null;
  keywords: string[] | null;
}

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
  
  // Prepare insights from keywords if available
  const getInsights = () => {
    if (!analysisData?.keywords || analysisData.keywords.length === 0) {
      return [];
    }
    
    // Take up to 3 keywords to show as insights
    return analysisData.keywords.slice(0, 3);
  };
  
  const insights = getInsights();
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
              <Alert className="bg-slate-50 border border-slate-200">
                <Info className="h-4 w-4 text-slate-500" />
                <AlertDescription>
                  Complete more chat sessions to receive personalized insights about your communication patterns.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {insights.length > 0 && insights.map((keyword, index) => (
                  <React.Fragment key={index}>
                    <div className="space-y-2">
                      <h3 className="font-medium">Insight {index + 1}: {keyword}</h3>
                      <p className="text-muted-foreground text-sm">
                        This topic appeared frequently in your conversations.
                      </p>
                    </div>
                    {index < insights.length - 1 && <Separator />}
                  </React.Fragment>
                ))}
                
                {analysisData?.summary_text && (
                  <>
                    {insights.length > 0 && <Separator />}
                    <div className="mt-2 p-3 bg-slate-50 rounded-md">
                      <p className="text-sm font-medium">Summary:</p>
                      <p className="text-sm">{analysisData.summary_text}</p>
                    </div>
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
