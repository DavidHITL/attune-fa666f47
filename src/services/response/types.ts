
import { Message } from "@/components/MessageBubble";

/**
 * Response generator options
 */
export interface ResponseGeneratorOptions {
  sessionProgress?: number;
  useContextEnrichment?: boolean;
}

/**
 * Message format expected by API
 */
export interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * API request payload
 */
export interface ApiRequestPayload {
  messages: ApiMessage[];
  sessionProgress: number;
  contextData: ApiContextData | null;
}

/**
 * Context data format expected by API
 */
export interface ApiContextData {
  recentMessages?: string[];
  therapyConcepts?: any[];
  therapySources?: any[];
  userDetails?: Record<string, string>;
  criticalInformation?: string[];
  analysisResults?: {
    summary?: string;
    keywords?: string[];
    losingStrategies?: any;
  };
}
