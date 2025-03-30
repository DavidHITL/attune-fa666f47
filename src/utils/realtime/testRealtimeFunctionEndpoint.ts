
/**
 * Tests HTTP access to the realtime function endpoint
 */
export const testRealtimeFunctionEndpoint = async (): Promise<{success: boolean, message: string}> => {
  console.log("[testRealtimeFunctionEndpoint] Testing HTTP access to realtime function");
  
  try {
    const projectId = 'oseowhythgbqvllwonaz';
    const functionUrl = `https://${projectId}.supabase.co/functions/v1/realtime-chat`;
    
    console.log("[testRealtimeFunctionEndpoint] Sending HTTP request to:", functionUrl);
    
    // Send HTTP request to check if the function is accessible
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log("[testRealtimeFunctionEndpoint] Response status:", response.status);
    
    if (response.ok) {
      try {
        const data = await response.json();
        console.log("[testRealtimeFunctionEndpoint] Response data:", data);
        return {
          success: true,
          message: `Function accessible. Status: ${response.status}. Message: ${data.message || JSON.stringify(data)}`
        };
      } catch (jsonError) {
        const text = await response.text();
        console.log("[testRealtimeFunctionEndpoint] Response text:", text);
        return {
          success: true,
          message: `Function accessible. Status: ${response.status}. Response is not JSON: ${text.substring(0, 100)}`
        };
      }
    } else {
      try {
        const errorData = await response.json();
        return {
          success: false,
          message: `Error: ${response.status} ${response.statusText}. ${errorData.error || JSON.stringify(errorData)}`
        };
      } catch (jsonError) {
        const text = await response.text();
        return {
          success: false,
          message: `Error: ${response.status} ${response.statusText}. ${text.substring(0, 100)}`
        };
      }
    }
  } catch (error) {
    console.error("[testRealtimeFunctionEndpoint] Error testing function:", error);
    return {
      success: false,
      message: `Network error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};
