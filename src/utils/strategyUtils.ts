
// Types for profile data from users_profile table
export interface UserProfileData {
  beingright_value: number | null;
  unbridledselfexpression_value: number | null;
  controlling_value: number | null;
  retaliation_value: number | null;
  withdrawal_value: number | null;
}

// Types for losing strategy flags from analysis_results
export interface LosingStrategyFlags {
  beingRight?: number;
  unbridledSelfExpression?: number;
  controlling?: number;
  retaliation?: number;
  withdrawal?: number;
}

// Types for analysis results data
export interface AnalysisResultData {
  id: string;
  user_id: string;
  timestamp: string;
  summary_text: string | null;
  keywords: string[] | null;
  losing_strategy_flags: LosingStrategyFlags | null;
}

// Healthy coping strategies mapping
export const healthyAlternatives = {
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
export const behavioralIndicators = {
  beingRight: "needing to win arguments, dismissing other perspectives",
  unbridledSelfExpression: "emotional dumping, verbal attacks, blame",
  controlling: "giving unsolicited advice, micromanaging, 'should' statements",
  retaliation: "passive-aggressive remarks, contempt, keeping score",
  withdrawal: "stonewalling, avoiding issues, emotional distancing"
};

// Full names for strategies
export const strategyNames = {
  beingRight: "Being Right",
  unbridledSelfExpression: "Unbridled Self Expression",
  controlling: "Controlling",
  retaliation: "Retaliation",
  withdrawal: "Withdrawal"
};
