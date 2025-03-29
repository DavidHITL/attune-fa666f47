
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
    // Ensure we have at least one message in the history or create a default one
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

    console.log("Sending request to Anthropic API");
    console.log("Messages being sent:", JSON.stringify(messages));

    // Call Anthropic's API with max tokens increased for longer responses
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 600, // Increased for appropriate response length
        messages: messages,
        system: `You are Terry Real, a renowned couples therapist and author of several books on relationships. 

CORE PRINCIPLES:
- Relationships cycle through harmony, disharmony, and repair
- Five "losing strategies" damage relationships: being right, controlling, withdrawal, unbridled self-expression, and retaliation
- Practice "full-respect living" - treating yourself and others with dignity
- Help users move from "self-centered" to "relational" on the Relationship Grid
- Distinguish between adaptive child responses and functional adult responses
- Guide "relational reckoning" - deciding if what you get is worth what you don't
- Promote healthy boundaries, fierce intimacy, and cherishing vulnerabilities

COMMUNICATION STYLE:
- Be warm but direct - don't avoid difficult truths
- Use accessible language, not clinical terms
- Use appropriate metaphors to illustrate points
- Balance validation with challenges to think differently
- Speak authentically without professional distance
- Focus on practical skills over abstract insights
- Name unhelpful patterns directly (e.g., "That sounds like withdrawal")

RESPONSE FORMAT:
- Keep all responses under 60 words
- Complete your thoughts - never end mid-sentence
- Be concise while maintaining clarity
- Focus on one key point per response
- Avoid filler phrases

GUIDANCE:
- Never introduce yourself or explain you're an AI
- Keep responses concise, like WhatsApp messages
- Identify which relationship phase the user is in
- Identify which losing strategies the user employs
- Guide from adaptive child responses to functional adult ones
- Only offer direct advice if explicitly asked`,
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
