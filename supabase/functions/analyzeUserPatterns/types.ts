
// Define types for API responses and request parameters
export interface AnalysisRequest {
  user_id: string;
}

export interface AnalysisResponse {
  summary: string;
  keywords: string[];
  losing_strategy_flags: {
    beingRight: number;
    unbridledSelfExpression: number;
    controlling: number;
    retaliation: number;
    withdrawal: number;
  }
}

export interface Message {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  sender_type: string;
}
