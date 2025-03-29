
import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import LosingStrategiesChart from "./LosingStrategiesChart";
import StrategyInsight from "./StrategyInsight";
import { UserProfileData, AnalysisResultData, LosingStrategyFlags, strategyNames } from "@/utils/strategyUtils";
import { StrategyChartData } from "./LosingStrategiesChart";

interface StrategyDataHandlerProps {
  profileData?: UserProfileData;
  analysisData?: AnalysisResultData | null;
  isLoading: boolean;
}

const StrategyDataHandler: React.FC<StrategyDataHandlerProps> = ({ 
  profileData, 
  analysisData, 
  isLoading 
}) => {
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

  const chartData = prepareChartData();
  const hasData = analysisData?.losing_strategy_flags || profileData;
  const topStrategies = getTopLosingStrategies();

  if (!hasData && !isLoading) {
    return (
      <Alert className="bg-slate-50 border border-slate-200 mb-4">
        <Info className="h-4 w-4 text-slate-500" />
        <AlertDescription>
          Insufficient data for accurate analysis. Complete more chat sessions for personalized insights.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <LosingStrategiesChart chartData={chartData} />
      
      <div className="mt-6 space-y-4">
        {topStrategies.length > 0 ? (
          topStrategies.map((strategy, index) => (
            <StrategyInsight key={strategy} strategy={strategy} index={index} />
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
  );
};

export default StrategyDataHandler;
