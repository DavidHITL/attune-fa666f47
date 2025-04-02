
import { Message } from "@/components/MessageBubble";

export interface ResponseGeneratorOptions {
  sessionProgress?: number;
  useContextEnhancement?: boolean;
  includeKnowledgeBase?: boolean;
}

export interface ResponseData {
  text: string;
  timestamp: Date;
  messageType?: 'text' | 'voice' | 'system';
  instructions?: string;
  knowledgeEntries?: any[];
}

// Types for API interaction
export interface ApiMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ApiRequestPayload {
  messages: ApiMessage[];
  sessionProgress?: number;
  contextData?: ApiContextData | null;
  useContextEnhancement?: boolean;
}

export interface ApiContextData {
  recentMessages?: any[];
  therapyConcepts?: any[];
  therapySources?: any[];
  userDetails?: any;
  criticalInformation?: any[];
  analysisResults?: any;
}

export interface KnowledgeEntry {
  id: string;
  type: string;
  title: string;
  content: string;
  [key: string]: any; // Add index signature for flexibility
}
