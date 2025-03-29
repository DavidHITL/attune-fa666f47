
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.12.0";

interface RequestBody {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

serve(async (req) => {
  // Set up CORS to allow requests from your app
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    // Get the Anthropic API key from environment variables
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Parse the request body
    const { message, conversationHistory = [] } = await req.json() as RequestBody;

    if (!message) {
      throw new Error("Message is required");
    }

    // Prepare messages for Anthropic API
    // If there's conversation history, use it; otherwise, start fresh
    const messages = conversationHistory.length > 0 
      ? conversationHistory
      : [
          {
            role: "assistant",
            content: "Hello, I'm here to listen and support you. How are you feeling today?"
          }
        ];
    
    // Add the user's current message
    messages.push({
      role: "user",
      content: message
    });

    // Send request to Anthropic's Claude API (using Claude 3 Opus for best reasoning)
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: messages,
      system: "You are a supportive, empathetic, and thoughtful AI assistant. Your purpose is to help the user reflect on their feelings and experiences. Respond with warmth and understanding. Keep responses concise and conversational.",
    });

    // Return the response
    return new Response(
      JSON.stringify({
        reply: response.content[0].text,
        success: true,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error.message);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
});
