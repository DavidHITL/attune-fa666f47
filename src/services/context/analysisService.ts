
import { supabase } from "@/integrations/supabase/client";

export interface AnalysisResult {
  summary?: string;
  keywords?: string[];
  losingStrategies?: {
    beingRight?: number;
    controlling?: number;
    unbridledSelfExpression?: number;
    retaliation?: number;
    withdrawal?: number;
  };
}

/**
 * Fetch analysis results for a specific user
 * This now handles the case where analysis might not exist yet
 */
export const fetchAnalysisResults = async (userId: string): Promise<AnalysisResult | null> => {
  try {
    console.log(`[AnalysisService] Fetching analysis results for user: ${userId}`);
    
    // First check if there are any analysis results
    const { data: hasResults, error: checkError } = await supabase
      .from('analysis_results')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle instead of single to avoid errors
    
    // If no results exist yet, return null without logging errors
    if (checkError || !hasResults) {
      console.log(`[AnalysisService] No analysis results found for user: ${userId}`);
      return null;
    }
    
    // Fetch actual analysis results
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error || !data) {
      console.warn(`[AnalysisService] Error fetching analysis results: ${error?.message}`);
      return null;
    }
    
    console.log(`[AnalysisService] Analysis results fetched successfully for user: ${userId}`);
    
    // Extract and return analysis result data with proper type checking
    const losingStrategyFlags = data.losing_strategy_flags ? 
      (typeof data.losing_strategy_flags === 'string' 
        ? JSON.parse(data.losing_strategy_flags) 
        : data.losing_strategy_flags) 
      : {};
    
    return {
      summary: data.summary_text || undefined,
      keywords: data.keywords || undefined,
      losingStrategies: {
        beingRight: losingStrategyFlags?.beingRight,
        controlling: losingStrategyFlags?.controlling,
        unbridledSelfExpression: losingStrategyFlags?.unbridledSelfExpression,
        retaliation: losingStrategyFlags?.retaliation,
        withdrawal: losingStrategyFlags?.withdrawal
      }
    };
  } catch (error) {
    console.error("[AnalysisService] Error in fetchAnalysisResults:", error);
    return null;
  }
};

/**
 * Check if analysis exists for a user
 */
export const doesAnalysisExist = async (userId: string): Promise<boolean> => {
  try {
    const { count, error } = await supabase
      .from('analysis_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    if (error) {
      console.warn(`[AnalysisService] Error checking analysis existence: ${error.message}`);
      return false;
    }
    
    return count !== null && count > 0;
  } catch (error) {
    console.error("[AnalysisService] Error in doesAnalysisExist:", error);
    return false;
  }
};
