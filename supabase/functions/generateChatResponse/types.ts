
export interface RequestBody {
  message: string;
  conversationHistory?: { role: string; content: string }[];
  sessionProgress?: number;
  contextData?: {
    therapyConcepts?: any[];
    therapySources?: any[];
    recentMessages?: string[];
    userDetails?: Record<string, string>; // User details field
    criticalInformation?: string[]; // Critical information field
    analysisResults?: {
      summary?: string;
      keywords?: string[];
      losingStrategies?: {
        beingRight: number;
        unbridledSelfExpression: number;
        controlling: number;
        retaliation: number;
        withdrawal: number;
      };
    }; // New field for analysis results
  };
}
