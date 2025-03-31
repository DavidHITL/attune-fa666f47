
/**
 * Tests the realtime function endpoint using various methods
 */
export const testRealtimeFunctionEndpoint = async (): Promise<{success: boolean; message: string; data?: any}> => {
  console.log("[testRealtimeFunctionEndpoint] Starting realtime endpoint test");
  
  try {
    // Use the correct project ID from your Supabase configuration
    const projectId = 'oseowhythgbqvllwonaz';
    const endpoint = `https://${projectId}.supabase.co/functions/v1/realtime-chat`;

    // First, test using a regular HTTP request to check general accessibility
    console.log("[testRealtimeFunctionEndpoint] Testing HTTP endpoint:", endpoint);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const data = await response.text();
    console.log("[testRealtimeFunctionEndpoint] HTTP response:", response.status, data);
    
    if (!response.ok) {
      return {
        success: false,
        message: `HTTP endpoint returned status ${response.status}: ${data}`,
        data: { status: response.status, body: data }
      };
    }
    
    return {
      success: true,
      message: `Successfully connected to HTTP endpoint. Status: ${response.status}`,
      data: { status: response.status, body: data }
    };
  } catch (error) {
    console.error("[testRealtimeFunctionEndpoint] Error testing endpoint:", error);
    return {
      success: false,
      message: `Error testing endpoint: ${error instanceof Error ? error.message : String(error)}`,
      data: { error: String(error) }
    };
  }
};
