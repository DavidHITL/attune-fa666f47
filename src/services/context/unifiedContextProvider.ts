
/**
 * Unified Context Provider
 * Re-exports all context-related functionality from modular files
 * This provides backwards compatibility with existing imports
 */

// Export from initialContextLoader
export { getMinimalInstructions } from './initialContextLoader';

// Export from enhancedContextLoader
export { getUnifiedEnhancedInstructions } from './enhancedContextLoader';

// Export from sessionContextUpdater
export { updateSessionWithFullContext } from './sessionContextUpdater';

// Export from contextVerification
export { 
  trackModeTransition,
  logContextVerification
} from './contextVerification';

// Export from contextSummary
export { getRecentContextSummary } from './contextSummary';
