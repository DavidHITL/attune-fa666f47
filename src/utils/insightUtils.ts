
// Types for insights and analysis data
export interface AnalysisResultData {
  id: string;
  user_id: string;
  timestamp: string;
  summary_text: string | null;
  keywords: string[] | null;
}

// Helper functions for insight data
export const formatInsightData = (keywords: string[] | null): string[] => {
  if (!keywords || keywords.length === 0) {
    return [];
  }
  // Take up to 3 keywords to show as insights
  return keywords.slice(0, 3);
};

