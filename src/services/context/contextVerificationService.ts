
import { supabase } from "@/integrations/supabase/client";

/**
 * Verify if the context verification logs table exists 
 * and create it if it doesn't
 */
export const ensureContextVerificationTable = async () => {
  try {
    // Check if the table exists by trying to select from it
    const { error } = await supabase
      .from('context_verification_logs')
      .select('id')
      .limit(1);
    
    // If the table doesn't exist, the error code will be '42P01'
    if (error && error.code === '42P01') {
      console.warn("Context verification logs table does not exist. It needs to be created in the database.");
      return false;
    }
    
    return true;
  } catch (err) {
    console.error("Error checking for context verification table:", err);
    return false;
  }
};

/**
 * Log context verification event to console if database logging fails
 */
export const logToConsoleIfDbFails = (
  eventData: Record<string, any>,
  error?: Error
) => {
  if (error) {
    console.log("Context verification log (DB failed):", {
      ...eventData,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};
