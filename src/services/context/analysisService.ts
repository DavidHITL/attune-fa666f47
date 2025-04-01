
import { supabase } from "@/integrations/supabase/client";
import { LosingStrategyFlags } from "@/utils/strategyUtils";

/**
 * Fetch user's analysis results from database
 */
export const fetchAnalysisResults = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('summary_text, keywords, losing_strategy_flags')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      console.log("No analysis results found or error:", error);
      return null;
    }
    
    // Type assertion and validation to ensure proper structure
    const losingStrategiesData = data.losing_strategy_flags as LosingStrategyFlags | null;
    
    // Check if losing strategies data is properly structured
    const validatedLosingStrategies = losingStrategiesData ? {
      beingRight: typeof losingStrategiesData.beingRight === 'number' ? losingStrategiesData.beingRight : undefined,
      unbridledSelfExpression: typeof losingStrategiesData.unbridledSelfExpression === 'number' ? losingStrategiesData.unbridledSelfExpression : undefined,
      controlling: typeof losingStrategiesData.controlling === 'number' ? losingStrategiesData.controlling : undefined,
      retaliation: typeof losingStrategiesData.retaliation === 'number' ? losingStrategiesData.retaliation : undefined,
      withdrawal: typeof losingStrategiesData.withdrawal === 'number' ? losingStrategiesData.withdrawal : undefined
    } : undefined;
    
    return {
      summary: data.summary_text,
      keywords: data.keywords,
      losingStrategies: validatedLosingStrategies
    };
  } catch (err) {
    console.error("Error fetching analysis results:", err);
    return null;
  }
};
