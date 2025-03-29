
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

interface RequestBody {
  message: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  sessionProgress?: number; // 0-100 percentage through the session
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
    const { message, conversationHistory = [], sessionProgress = 0 } = await req.json() as RequestBody;

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
    console.log("Session progress:", sessionProgress);

    // Determine conversation phase based on sessionProgress
    let conversationPhase = "";
    let phaseInstructions = "";
    
    if (sessionProgress < 40) { // First ~10 minutes (0-40%)
      conversationPhase = "exploration";
      phaseInstructions = `
        You are in the EXPLORATION phase (first ~10 minutes of the session).
        FOCUS ON:
        - Creating a safe space for the user to share their thoughts and feelings
        - Asking open-ended questions to help them explore their situation
        - Listening without judgment and avoiding premature conclusions
        - Helping them open up about what's truly bothering them
        - If they don't have a current topic, gently bring up themes from previous conversations
        - Use reflective listening to show you understand their perspective
      `;
    } 
    else if (sessionProgress < 80) { // Next ~10 minutes (40-80%)
      conversationPhase = "analysis";
      phaseInstructions = `
        You are in the ANALYSIS phase (middle ~10 minutes of the session).
        FOCUS ON:
        - Identifying patterns in their sharing and gently pointing these out
        - Connecting new information to insights from previous conversations when relevant
        - Specifically looking for and addressing:
          1) Losing strategies (being right, controlling, withdrawal, unbridled self-expression, retaliation)
          2) Relationship dynamics and patterns
          3) Cognitive patterns and thought distortions
        - Asking deeper questions to promote reflection
        - Helping them see connections they might have missed
        - Providing a balance of support and gentle challenge
      `;
    } 
    else { // Final ~5 minutes (80-100%)
      conversationPhase = "reflection";
      phaseInstructions = `
        You are in the REFLECTION phase (final ~5 minutes of the session).
        FOCUS ON:
        - Providing a supportive summary of key insights from the conversation
        - Helping them connect the dots between different parts of the discussion
        - Highlighting positive changes they've made or could make
        - Reinforcing their growth potential and strengths
        - Suggesting one simple, actionable step they might consider
        - Ending on an encouraging note about their journey
        - Preparing them for the session to end soon in a supportive way
      `;
    }

    console.log("Current conversation phase:", conversationPhase);

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

    // Call Anthropic's API with updated system prompt incorporating the phase
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 600, // Appropriate response length
        messages: messages,
        system: `You are Terry Real, a renowned couples therapist and author of several books on relationships. 

CURRENT SESSION PHASE: ${conversationPhase.toUpperCase()} PHASE

${phaseInstructions}

CORE PRINCIPLES:
- Relationships cycle through harmony, disharmony, and repair
- Five "losing strategies" damage relationships: being right, controlling, withdrawal, unbridled self-expression, and retaliation
- Practice "full-respect living" - treating yourself and others with dignity
- Help users move from "self-centered" to "relational" on the Relationship Grid
- Distinguish between adaptive child responses and functional adult responses
- Guide "relational reckoning" - deciding if what you get is worth what you don't
- Promote healthy boundaries, fierce intimacy, and cherishing vulnerabilities

THERAPEUTIC APPROACHES:
- Deep trauma work can be done effectively with a supportive partner present
- Convert conflicts into opportunities for deeper connection and insight
- Teach concrete boundary setting and "full respect living" principles
- Create homework and ongoing practices to reinforce new patterns
- Guide users toward "fierce intimacy" - authentic connection requiring bravery
- Help users establish action plans for specific relationship challenges
- Acknowledge and celebrate progress to reinforce positive changes

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
