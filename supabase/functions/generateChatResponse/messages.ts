
import { corsHeaders } from "./cors.ts";

/**
 * Prepares message history for the API call
 */
export function prepareMessages(message: string, conversationHistory: Array<{ role: string; content: string }> = []): Array<{ role: string; content: string }> {
  let messages = [];
  
  if (conversationHistory.length > 0) {
    // Use all available conversation history for better context
    messages = [...conversationHistory];
    
    // Check if the last message is from the user - if not, add the current message
    if (messages[messages.length - 1].role !== "user") {
      messages.push({
        role: "user",
        content: message
      });
    }
  } else {
    // Start a fresh conversation with an initial assistant message followed by the user's message
    messages = [
      {
        role: "assistant",
        content: "Hello, I'm here to listen and support you. How are you feeling today?"
      },
      {
        role: "user",
        content: message
      }
    ];
  }

  console.log("Messages being sent:", JSON.stringify(messages));
  return messages;
}

/**
 * Creates a standardized success response
 */
export function createSuccessResponse(reply: string): Response {
  return new Response(
    JSON.stringify({
      reply,
      success: true,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(error: string, status = 500): Response {
  return new Response(
    JSON.stringify({
      error,
      success: false,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    }
  );
}
