
/**
 * Calculates the session progress as a percentage (0-100%)
 * 
 * @param sessionStarted Whether the session has started
 * @param sessionEndTime The timestamp when the session will end
 * @returns Percentage of session completed (0-100)
 */
export const calculateSessionProgress = (
  sessionStarted: boolean,
  sessionEndTime: number | null
): number => {
  if (!sessionStarted || !sessionEndTime) return 0;
  
  const now = Date.now();
  const sessionDuration = 25 * 60 * 1000; // 25 minutes in ms
  const sessionStartTime = sessionEndTime - sessionDuration;
  const elapsed = now - sessionStartTime;
  
  // Return percentage of session completed (0-100)
  return Math.min(100, Math.max(0, (elapsed / sessionDuration) * 100));
};
