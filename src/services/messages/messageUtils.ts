
import { v4 as uuidv4 } from 'uuid';

// Define message metadata type locally to avoid dependency issues
export interface MessageMetadata {
  messageType?: 'text' | 'voice' | 'system';
  instructions?: string;
  knowledgeEntries?: KnowledgeEntry[];
}

// Define knowledge entry type locally to avoid dependency issues
export interface KnowledgeEntry {
  type: string;
  content: string;
  description?: string;
  interface?: string;
}

export interface MessageData {
  content: string;
  isUser: boolean;
  timestamp: string;
  messageType?: 'text' | 'voice' | 'system';
  knowledgeEntries?: KnowledgeEntry[];
  instructions?: string;
}

// Create a message object with the given text and user status
export function createMessageObject(text: string, isUser: boolean, metadata?: Partial<MessageMetadata>) {
  return {
    id: uuidv4(),
    text, // Use 'text' as the key for message content for Message type
    content: text, // Keep 'content' for compatibility with MessageData
    isUser,
    timestamp: new Date(),
    messageType: (metadata?.messageType || 'text') as 'text' | 'voice' | 'system',
    instructions: metadata?.instructions,
    knowledgeEntries: metadata?.knowledgeEntries
  };
}
