
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Anthropic } from "https://esm.sh/@anthropic-ai/sdk@0.12.0";

interface RequestBody {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Get the Anthropic API key from environment variables
    const anthropicApiKey = Deno.env.get("anthropic-attune-api-key");
    
    if (!anthropicApiKey) {
      throw new Error("anthropic-attune-api-key environment variable is not set");
    }

    const anthropic = new Anthropic({
      apiKey: anthropicApiKey,
    });

    // Parse the request body
    const { message, conversationHistory = [] } = await req.json() as RequestBody;

    if (!message) {
      throw new Error("Message is required");
    }

    console.log("Received message:", message);
    console.log("Conversation history length:", conversationHistory.length);

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

    console.log("Sending request to Anthropic API");

    // Send request to Anthropic's Claude API
    const response = await anthropic.messages.create({
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      messages: messages,
      system: "You are a supportive, empathetic, and thoughtful AI assistant. Your purpose is to help the user reflect on their feelings and experiences. Respond with warmth and understanding. Keep responses concise and conversational.",
    });

    console.log("Received response from Anthropic API");

    // Return the response
    return new Response(
      JSON.stringify({
        reply: response.content[0].text,
        success: true,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error("Error in generateChatResponse function:", error);
    
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
