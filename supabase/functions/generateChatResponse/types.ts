
export interface RequestBody {
  message: string;
  conversationHistory?: { role: string; content: string }[];
  sessionProgress?: number;
  contextData?: {
    therapyConcepts?: any[];
    therapySources?: any[];
    recentMessages?: string[];
  };
}
