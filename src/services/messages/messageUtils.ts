import { MessageMetadata } from "@/hooks/useWebRTCConnection/types";
import { KnowledgeEntry } from "@/types/knowledge";

export interface MessageData {
  content: string;
  isUser: boolean;
  timestamp: string;
  messageType?: 'text' | 'voice' | 'system';
  knowledgeEntries?: KnowledgeEntry[];
  instructions?: string;
}
