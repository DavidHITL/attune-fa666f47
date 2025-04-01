
export interface RequestBody {
  message: string;
  conversationHistory?: { role: string; content: string }[];
  sessionProgress?: number;
  contextData?: {
    therapyConcepts?: any[];
    therapySources?: any[];
    recentMessages?: string[];
    userDetails?: Record<string, string>; // New field for consistent user details
    criticalInformation?: string[]; // New field for critical information to always include
  };
}
