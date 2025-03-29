
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
      console.error("Missing API key: anthropic-attune-api-key environment variable is not set");
      return new Response(
        JSON.stringify({
          error: "API key configuration error",
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

    // Parse the request body
    const { message, conversationHistory = [] } = await req.json() as RequestBody;

    if (!message) {
      return new Response(
        JSON.stringify({
          error: "Message is required",
          success: false,
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Received message:", message);
    console.log("Conversation history length:", conversationHistory.length);

    // Prepare messages for Anthropic API
    const messages = conversationHistory.length > 0 
      ? [...conversationHistory]
      : [
          {
            role: "assistant",
            content: "Hello, I'm here to listen and support you. How are you feeling today?"
          }
        ];
    
    // Add the user's current message if it's not already the last one
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      messages.push({
        role: "user",
        content: message
      });
    }

    console.log("Sending request to Anthropic API");

    // Call Anthropic's API directly
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 1000,
        messages: messages,
        system: "You are a supportive, empathetic, and thoughtful AI assistant. Your purpose is to help the user reflect on their feelings and experiences. Respond with warmth and understanding. Keep responses concise and conversational.",
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Anthropic API Error Response:", errorData);
      throw new Error(`API returned ${response.status}: ${errorData}`);
    }
    
    const data = await response.json();
    console.log("Received response from Anthropic API");

    // Return the response
    return new Response(
      JSON.stringify({
        reply: data.content[0].text,
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
