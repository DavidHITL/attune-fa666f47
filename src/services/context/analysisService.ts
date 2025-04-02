import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

export interface AnalysisResults {
  summary: string | null;
  keywords: string[];
  losingStrategies: {
    beingRight: number;
    controlling: number;
    unbridledSelfExpression: number;
    retaliation: number;
    withdrawal: number;
  } | null;
}

export async function formatLosingStrategies(strategies: Json | null): Promise<Record<string, number> | null> {
  if (!strategies) return null;
  
  try {
    // If it's a string, try to parse it
    if (typeof strategies === 'string') {
      const parsed = JSON.parse(strategies);
      return parsed;
    }
    
    // If it's already an object, use it
    if (typeof strategies === 'object') {
      // Cast it to a Record<string, number> - we'll do safety checks when accessing
      return strategies as Record<string, number>;
    }
    
    return null;
  } catch (error) {
    console.error("[Analysis] Error formatting losing strategies:", error);
    return null;
  }
}

export async function doesAnalysisExist(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (error) {
      console.error("[Analysis] Error checking analysis existence:", error);
      return false;
    }
    
    return !!data;
  } catch (error) {
    console.error("[Analysis] Error in doesAnalysisExist:", error);
    return false;
  }
}

export async function fetchAnalysisResults(userId: string): Promise<AnalysisResults | null> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      if (error?.code === '406') {
        // This is often a false positive, just log and continue
        console.log("[Analysis] Note: 406 error fetching analysis results, likely not found");
      } else if (error) {
        console.error("[Analysis] Error fetching analysis results:", error);
      } else {
        console.log("[Analysis] No analysis results found for user:", userId);
      }
      return null;
    }
    
    // Format the losing strategies safely
    const strategies = await formatLosingStrategies(data.losing_strategy_flags);
    
    const analysisResults: AnalysisResults = {
      summary: data.summary_text,
      keywords: data.keywords || [],
      losingStrategies: strategies ? {
        // Safely access properties with optional chaining and nullish coalescing
        beingRight: Number(strategies?.beingRight ?? 0),
        controlling: Number(strategies?.controlling ?? 0),
        unbridledSelfExpression: Number(strategies?.unbridledSelfExpression ?? 0),
        retaliation: Number(strategies?.retaliation ?? 0),
        withdrawal: Number(strategies?.withdrawal ?? 0)
      } : null
    };
    
    return analysisResults;
  } catch (error) {
    console.error("[Analysis] Error in fetchAnalysisResults:", error);
    return null;
  }
}
