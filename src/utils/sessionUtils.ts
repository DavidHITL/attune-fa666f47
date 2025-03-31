/**
 * Calculate session progress as a percentage
 * @param sessionStarted boolean indicating if session has started
 * @param sessionEndTime end time in milliseconds since epoch
 * @returns number between 0 and 100 representing session progress
 */
export const calculateSessionProgress = (
  sessionStarted: boolean,
  sessionEndTime: number | null
): number => {
  if (!sessionStarted || !sessionEndTime) {
    return 0;
  }

  const now = Date.now();
  const SESSION_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds
  const elapsedTime = sessionEndTime - now;
  
  // Calculate how much time has passed as percentage
  // (SESSION_DURATION - elapsedTime) / SESSION_DURATION * 100
  const progress = Math.max(
    0, 
    Math.min(
      100, 
      ((SESSION_DURATION - elapsedTime) / SESSION_DURATION) * 100
    )
  );
  
  return progress;
};
