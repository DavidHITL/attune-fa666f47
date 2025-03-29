
import React from "react";
import { Radar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LosingStrategiesChart, { StrategyChartData } from "./LosingStrategiesChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Interface for the profile data from users_profile table
interface UserProfileData {
  beingright_value: number | null;
  unbridledselfexpression_value: number | null;
  controlling_value: number | null;
  retaliation_value: number | null;
  withdrawal_value: number | null;
}

interface LosingStrategiesCardProps {
  profileData?: UserProfileData;
}

const LosingStrategiesCard: React.FC<LosingStrategiesCardProps> = ({ profileData }) => {
  const { user } = useAuth();
  
  // Fetch the latest analysis results if available
  const { data: analysisData } = useQuery({
    queryKey: ['analysisResults', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('analysis_results')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
          console.error("Error fetching analysis results:", error);
        }
        return null;
      }
      
      return data;
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
      const flags = analysisData.losing_strategy_flags;
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

  return (
    <Card className="border border-apple-gray-5 rounded-lg shadow-sm">
      <CardHeader className="flex flex-row items-center gap-2">
        <Radar className="h-5 w-5 text-apple-blue" />
        <CardTitle className="text-xl">Losing Strategies</CardTitle>
      </CardHeader>
      <CardContent>
        <LosingStrategiesChart chartData={chartData} />
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">
            This visualization shows your tendency toward five losing strategies in communication.
            Lower scores indicate healthier communication patterns.
          </p>
          {analysisData?.summary_text && (
            <div className="mt-3 p-3 bg-slate-50 rounded-md">
              <p className="text-sm font-medium">Analysis Summary:</p>
              <p className="text-sm">{analysisData.summary_text}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LosingStrategiesCard;
