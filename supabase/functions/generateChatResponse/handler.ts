
import { RequestBody } from "./types.ts";
import { corsHeaders } from "./cors.ts";
import { determinePhase, generateSystemPrompt } from "./phases.ts";
import { prepareMessages, createSuccessResponse, createErrorResponse } from "./messages.ts";
import { callAnthropicAPI } from "./anthropicClient.ts";

export async function handleRequest(req: Request): Promise<Response> {
  // Get the OpenAI API key from environment variables
  // Use OPENAI_API_KEY as the primary key name
  const openAiApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openAiApiKey) {
    console.error("Missing API key: OPENAI_API_KEY environment variable is not set");
    return createErrorResponse("API key configuration error", 500);
  }

  // Parse the request body
  const { message, conversationHistory = [], sessionProgress = 0, contextData = null } = await req.json() as RequestBody;

  if (!message) {
    return createErrorResponse("Message is required", 400);
  }

  console.log("Received message:", message);
  console.log("Conversation history length:", conversationHistory.length);
  console.log("Session progress:", sessionProgress);
  
  if (contextData) {
    console.log("Context data provided:", {
      therapyConcepts: contextData.therapyConcepts?.length || 0,
      therapySources: contextData.therapySources?.length || 0,
      recentMessages: contextData.recentMessages?.length || 0
    });
  }

  // Determine conversation phase based on sessionProgress
  const { phase, instructions } = determinePhase(sessionProgress);
  console.log("Current conversation phase:", phase);

  // Generate system prompt with phase-specific instructions
  let systemPrompt = generateSystemPrompt(phase, instructions);
  
  // Enhance system prompt with context if provided
  if (contextData) {
    if (contextData.therapyConcepts?.length) {
      const conceptsContext = contextData.therapyConcepts.map(c => 
        `${c.name}: ${c.description}`
      ).join('\n\n');
      
      systemPrompt += "\n\nTherapy Concepts Reference:\n" + conceptsContext;
    }
    
    if (contextData.therapySources?.length) {
      const sourcesContext = contextData.therapySources.map(s => 
        `"${s.title}" by ${s.author} (${s.year}): ${s.description || s.content_summary || ''}`
      ).join('\n\n');
      
      systemPrompt += "\n\nTherapy Sources Reference:\n" + sourcesContext;
    }
    
    if (contextData.recentMessages?.length) {
      const messagesContext = contextData.recentMessages.join('\n\n');
      systemPrompt += "\n\nRecent Conversation History:\n" + messagesContext;
    }
    
    console.log("Enhanced system prompt with context data");
  }

  // Prepare messages for OpenAI API
  const messages = prepareMessages(message, conversationHistory);

  // Call OpenAI API
  const reply = await callAnthropicAPI(openAiApiKey, messages, systemPrompt);

  // Return the response
  return createSuccessResponse(reply);
}
