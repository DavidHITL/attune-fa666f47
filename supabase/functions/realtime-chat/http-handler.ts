
import { corsHeaders, createErrorResponse, createSuccessResponse, getOpenAIApiKey } from "./utils.ts";

/**
 * Handle HTTP requests to create a new OpenAI Realtime session
 */
export async function handleHttpRequest(req: Request): Promise<Response> {
  try {
    const OPENAI_API_KEY = getOpenAIApiKey();
    
    // Create a session with OpenAI
    console.log("Creating a new OpenAI Realtime session");
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-10-01",
        voice: "alloy",
        instructions: "You are a helpful AI assistant that speaks naturally with users. Keep responses concise and conversational. You're here to help with any questions or tasks."
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", errorText);
      throw new Error(`OpenAI API returned status ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Session created:", data);
    
    return createSuccessResponse(data);
  } catch (error) {
    return createErrorResponse(error);
  }
}
