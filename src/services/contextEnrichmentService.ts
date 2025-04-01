
// This file now re-exports the refactored context service functionality
// for backward compatibility with existing imports
export { 
  fetchUserContext, 
  enhanceInstructionsWithContext,
  formatChatContext,
  formatKnowledgeEntries,
  ContextData
} from './context';
