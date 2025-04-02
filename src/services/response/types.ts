
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
