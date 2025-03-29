
import React from "react";
import { Radar, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LosingStrategiesChart, { StrategyChartData } from "./LosingStrategiesChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Interface for the profile data from users_profile table
interface UserProfileData {
  beingright_value: number | null;
  unbridledselfexpression_value: number | null;
  controlling_value: number | null;
  retaliation_value: number | null;
  withdrawal_value: number | null;
}

// Interface for the losing strategy flags from analysis_results
interface LosingStrategyFlags {
  beingRight?: number;
  unbridledSelfExpression?: number;
  controlling?: number;
  retaliation?: number;
  withdrawal?: number;
}

// Interface for analysis results data
interface AnalysisResultData {
  id: string;
  user_id: string;
  timestamp: string;
  summary_text: string | null;
  keywords: string[] | null;
  losing_strategy_flags: LosingStrategyFlags | null;
}

// Healthy coping strategies mapping
const healthyAlternatives = {
  beingRight: [
    "Focus on understanding rather than proving your point",
    "Ask curious questions instead of stating facts"
  ],
  unbridledSelfExpression: [
    "Express feelings with 'I' statements",
    "Take a pause before responding when emotional"
  ],
  controlling: [
    "Offer suggestions only when asked",
    "Respect others' autonomy in decisions"
  ],
  retaliation: [
    "Address issues directly without bringing up past wrongs",
    "Focus on resolution rather than revenge"
  ],
  withdrawal: [
    "Stay present even when uncomfortable",
    "Express need for space explicitly rather than disconnecting"
  ]
};

// Behavioral indicators for each strategy
const behavioralIndicators = {
  beingRight: "needing to win arguments, dismissing other perspectives",
  unbridledSelfExpression: "emotional dumping, verbal attacks, blame",
  controlling: "giving unsolicited advice, micromanaging, 'should' statements",
  retaliation: "passive-aggressive remarks, contempt, keeping score",
  withdrawal: "stonewalling, avoiding issues, emotional distancing"
};

// Full names for strategies
const strategyNames = {
  beingRight: "Being Right",
  unbridledSelfExpression: "Unbridled Self Expression",
  controlling: "Controlling",
  retaliation: "Retaliation",
  withdrawal: "Withdrawal"
};

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
  
  // Dummy data for the radar chart (if no real data available)
  const dummyChartData: StrategyChartData[] = [
    { subject: 'Being Right', value: 0, fullMark: 5 },
    { subject: 'Unbridled Self Expression', value: 0, fullMark: 5 },
    { subject: 'Controlling', value: 0, fullMark: 5 },
    { subject: 'Retaliation', value: 0, fullMark: 5 },
    { subject: 'Withdrawal', value: 0, fullMark: 5 },
  ];

  // Prepare data for the radar chart
  const prepareChartData = (): StrategyChartData[] => {
    // First try to use the analysis results if available
    if (analysisData?.losing_strategy_flags) {
      const flags = analysisData.losing_strategy_flags as LosingStrategyFlags;
      return [
        {
          subject: 'Being Right',
          value: flags.beingRight || 0,
          fullMark: 5,
        },
        {
          subject: 'Unbridled Self Expression',
          value: flags.unbridledSelfExpression || 0,
          fullMark: 5,
        },
        {
          subject: 'Controlling',
          value: flags.controlling || 0,
          fullMark: 5,
        },
        {
          subject: 'Retaliation',
          value: flags.retaliation || 0,
          fullMark: 5,
        },
        {
          subject: 'Withdrawal',
          value: flags.withdrawal || 0,
          fullMark: 5,
        },
      ];
    }
    
    // Fall back to profile data if analysis results not available
    if (profileData) {
      return [
        {
          subject: 'Being Right',
          value: profileData.beingright_value ?? 0,
          fullMark: 5,
        },
        {
          subject: 'Unbridled Self Expression',
          value: profileData.unbridledselfexpression_value ?? 0,
          fullMark: 5,
        },
        {
          subject: 'Controlling',
          value: profileData.controlling_value ?? 0,
          fullMark: 5,
        },
        {
          subject: 'Retaliation',
          value: profileData.retaliation_value ?? 0,
          fullMark: 5,
        },
        {
          subject: 'Withdrawal',
          value: profileData.withdrawal_value ?? 0,
          fullMark: 5,
        },
      ];
    }
    
    // Return dummy data if nothing else is available
    return dummyChartData;
  };

  const chartData = prepareChartData();
  
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
  
  // Find the top 1-2 losing strategies
  const getTopLosingStrategies = () => {
    if (!analysisData?.losing_strategy_flags) return [];
    
    const flags = analysisData.losing_strategy_flags;
    const strategies = Object.entries(flags)
      .filter(([_, value]) => value !== undefined && value > 0)
      .sort(([_, valueA], [__, valueB]) => (valueB as number) - (valueA as number))
      .slice(0, 2)
      .map(([key]) => key as keyof typeof strategyNames);
    
    return strategies;
  };
  
  const hasData = analysisData?.losing_strategy_flags || profileData;
  const lastUpdated = getLastUpdated();
  const topStrategies = getTopLosingStrategies();

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
        {!hasData && !isLoading ? (
          <Alert className="bg-slate-50 border border-slate-200 mb-4">
            <Info className="h-4 w-4 text-slate-500" />
            <AlertDescription>
              Insufficient data for accurate analysis. Complete more chat sessions for personalized insights.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <LosingStrategiesChart chartData={chartData} />
            
            <div className="mt-6 space-y-4">
              {topStrategies.length > 0 ? (
                topStrategies.map((strategy, index) => (
                  <div key={strategy} className="p-4 bg-slate-50 rounded-md">
                    <h3 className="font-medium text-base">
                      Losing Strategy {index + 1}: {strategyNames[strategy]}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      <span className="italic">{behavioralIndicators[strategy]}</span>
                    </p>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-700">Healthy Alternatives:</p>
                      <ul className="text-sm mt-1 space-y-1 list-disc pl-5">
                        {healthyAlternatives[strategy].map((alt, i) => (
                          <li key={i}>{alt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                hasData && (
                  <div className="p-4 bg-slate-50 rounded-md">
                    <p className="text-sm">
                      No significant losing strategies detected. Keep practicing healthy communication!
                    </p>
                  </div>
                )
              )}
            </div>
            
            {analysisData?.summary_text && (
              <div className="mt-4 p-3 bg-slate-50 rounded-md">
                <p className="text-sm font-medium">Analysis Summary:</p>
                <p className="text-sm">{analysisData.summary_text}</p>
              </div>
            )}
          </>
        )}
        
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
