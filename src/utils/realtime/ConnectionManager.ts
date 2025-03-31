
// This is a stub implementation to resolve dependencies
// All actual realtime functionality has been removed

/**
 * Simple ConnectionManager stub to prevent build errors
 */
export const ConnectionManager = {
  connect: async () => {
    console.warn("Real-time voice functionality has been removed");
    return false;
  },
  disconnect: () => {
    console.warn("Real-time voice functionality has been removed");
  }
};
