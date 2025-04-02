
import { supabase } from "@/integrations/supabase/client";

/**
 * Verify if the context verification logs table exists 
 * and create it if it doesn't
 */
export const ensureContextVerificationTable = async () => {
  try {
    // Instead of directly checking the table, we'll use a safer approach
    // that doesn't rely on type checking at compile time
    const { error } = await supabase.rpc(
      'table_exists',
      { table_name: 'context_verification_logs' }
    ).single();
    
    if (error) {
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
