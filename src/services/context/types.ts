
/**
 * Interface for context enrichment data
 */
export interface ContextData {
  historySummary: string;
  recentMessages: string[];
  userInstructions?: string;
  knowledgeEntries?: any[];
  userDetails?: Record<string, string>; // For consistent personal details like names
  criticalInformation?: string[]; // For important therapeutic insights that must be retained
  analysisResults?: {
    summary?: string;
    keywords?: string[];
    losingStrategies?: import("@/utils/strategyUtils").LosingStrategyFlags;
  }; // Field for analysis results
}

/**
 * Maximum number of messages to include in context
 * Increased from 25 to 100 for better continuity
 */
export const MAX_MESSAGE_COUNT = 100;
