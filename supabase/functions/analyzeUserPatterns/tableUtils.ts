
import { supabaseAdmin } from "./supabaseClient.ts";

/**
 * Check if a table exists in the database
 */
export const checkTableExists = async (tableName: string): Promise<boolean> => {
  try {
    // Use SQL query to check if table exists
    const { data, error } = await supabaseAdmin.from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);
    
    if (error) {
      console.error(`Error checking if table ${tableName} exists:`, error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (err) {
    console.error(`Exception checking if table ${tableName} exists:`, err);
    return false;
  }
};

/**
 * Create a new table if it doesn't exist
 */
export const createTableIfNotExists = async (tableName: string, createTableSql: string): Promise<boolean> => {
  try {
    // First check if table exists
    const exists = await checkTableExists(tableName);
    
    if (!exists) {
      // Execute SQL to create the table
      const { error } = await supabaseAdmin.rpc('run_sql', {
        sql: createTableSql
      });
      
      if (error) {
        console.error(`Error creating table ${tableName}:`, error);
        return false;
      }
      
      console.log(`Successfully created table ${tableName}`);
      return true;
    }
    
    return true; // Table already exists
  } catch (err) {
    console.error(`Exception creating table ${tableName}:`, err);
    return false;
  }
};
