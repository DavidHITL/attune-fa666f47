
import { RequestBody } from "./types.ts";
import { corsHeaders } from "./cors.ts";
import { determinePhase, generateSystemPrompt } from "./phases.ts";
import { prepareMessages, createSuccessResponse, createErrorResponse } from "./messages.ts";
import { callAnthropicAPI } from "./anthropicClient.ts";

export async function handleRequest(req: Request): Promise<Response> {
  // Get the Anthropic API key from environment variables
  const anthropicApiKey = Deno.env.get("anthropic-attune-api-key");
  
  if (!anthropicApiKey) {
    console.error("Missing API key: anthropic-attune-api-key environment variable is not set");
    return createErrorResponse("API key configuration error", 500);
  }

  // Parse the request body
  const { message, conversationHistory = [], sessionProgress = 0 } = await req.json() as RequestBody;

  if (!message) {
    return createErrorResponse("Message is required", 400);
  }

  console.log("Received message:", message);
  console.log("Conversation history length:", conversationHistory.length);
  console.log("Session progress:", sessionProgress);

  // Determine conversation phase based on sessionProgress
  const { phase, instructions } = determinePhase(sessionProgress);
  console.log("Current conversation phase:", phase);

  // Generate system prompt with phase-specific instructions
  const systemPrompt = generateSystemPrompt(phase, instructions);

  // Prepare messages for Anthropic API
  const messages = prepareMessages(message, conversationHistory);

  // Call Anthropic's API
  const reply = await callAnthropicAPI(anthropicApiKey, messages, systemPrompt);

  // Return the response
  return createSuccessResponse(reply);
}
