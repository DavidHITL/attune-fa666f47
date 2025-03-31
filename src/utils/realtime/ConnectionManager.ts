
/**
 * Simple ConnectionManager stub to prevent build errors
 * All actual realtime functionality has been removed
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
