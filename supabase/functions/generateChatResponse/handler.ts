
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
      recentMessages: contextData.recentMessages?.length || 0,
      userDetails: contextData.userDetails ? Object.keys(contextData.userDetails).length : 0,
      criticalInformation: contextData.criticalInformation?.length || 0,
      analysisResults: contextData.analysisResults ? "present" : "absent"
    });
  }

  // Determine conversation phase based on sessionProgress
  const { phase, instructions } = determinePhase(sessionProgress);
  console.log("Current conversation phase:", phase);

  // Generate system prompt with phase-specific instructions
  let systemPrompt = generateSystemPrompt(phase, instructions);
  
  // Enhance system prompt with context if provided
  if (contextData) {
    // Add user details and critical information at the beginning for highest priority
    if (contextData.userDetails) {
      const userDetailsText = Object.entries(contextData.userDetails)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      
      systemPrompt = `IMPORTANT USER DETAILS (always remember these):\n${userDetailsText}\n\n${systemPrompt}`;
    }
    
    if (contextData.criticalInformation?.length) {
      systemPrompt = `CRITICAL THERAPEUTIC INSIGHTS (maintain awareness of these):\n${contextData.criticalInformation.join('\n')}\n\n${systemPrompt}`;
    }
    
    // Add analysis results if available
    if (contextData.analysisResults) {
      let analysisText = "USER ANALYSIS RESULTS:\n";
      
      if (contextData.analysisResults.summary) {
        analysisText += `Summary: ${contextData.analysisResults.summary}\n`;
      }
      
      if (contextData.analysisResults.keywords && contextData.analysisResults.keywords.length) {
        analysisText += `Key Themes: ${contextData.analysisResults.keywords.join(', ')}\n`;
      }
      
      if (contextData.analysisResults.losingStrategies) {
        const strategies = contextData.analysisResults.losingStrategies;
        analysisText += "Losing Strategies Analysis:\n";
        if ('beingRight' in strategies) analysisText += `- Being Right: ${strategies.beingRight}/5\n`;
        if ('controlling' in strategies) analysisText += `- Controlling: ${strategies.controlling}/5\n`;
        if ('unbridledSelfExpression' in strategies) analysisText += `- Unbridled Self-Expression: ${strategies.unbridledSelfExpression}/5\n`;
        if ('retaliation' in strategies) analysisText += `- Retaliation: ${strategies.retaliation}/5\n`;
        if ('withdrawal' in strategies) analysisText += `- Withdrawal: ${strategies.withdrawal}/5\n`;
      }
      
      systemPrompt = `${analysisText}\n\n${systemPrompt}`;
    }
    
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
