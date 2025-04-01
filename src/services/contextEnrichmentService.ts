
// This file now re-exports the refactored context service functionality
// for backward compatibility with existing imports
export { 
  fetchUserContext, 
  enhanceInstructionsWithContext,
  formatChatContext,
  formatKnowledgeEntries
} from './context';

// Re-export types using the proper syntax for isolated modules
export type { ContextData } from './context';
