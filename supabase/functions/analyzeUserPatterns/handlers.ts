
import { corsHeaders } from "./cors.ts";
import { AnalysisRequest, AnalysisResponse } from "./types.ts";
import { analyzeWithAnthropic } from "./anthropicClient.ts";
import { fetchUserMessages, storeAnalysisResults } from "./dataAccess.ts";

// Process user messages and generate analysis
export async function processUserMessages(userId: string): Promise<AnalysisResponse> {
  // Fetch the user's messages
  const messages = await fetchUserMessages(userId);
  
  // Filter only the user's messages (not the AI responses)
  const userMessages = messages.filter(msg => msg.sender_type === 'user' && msg.content);

  if (userMessages.length === 0) {
    throw new Error("No messages found for this user");
  }

  console.log(`Analyzing ${userMessages.length} messages from user ${userId} (filtered out AI messages)`);

  // Create a text corpus from the messages for Claude to analyze
  const messageCorpus = userMessages
    .map(msg => `[${new Date(msg.created_at).toLocaleString()}] ${msg.content}`)
    .join("\n\n");

  console.log(`Found ${userMessages.length} user messages to analyze`);

  // Call Claude API to analyze the messages
  const claudeData = await analyzeWithAnthropic(messageCorpus);
  const analysisText = claudeData.content[0].text;
  
  // Extract JSON from Claude's response
  const jsonMatch = analysisText.match(/\{[\s\S]+\}/);
  if (!jsonMatch) {
    throw new Error("Could not extract JSON from Claude's response");
  }

  const analysisResult = JSON.parse(jsonMatch[0]) as AnalysisResponse;
  return analysisResult;
}

// Handle the analysis request
export async function handleAnalyzeRequest(req: Request): Promise<Response> {
  // Parse request body
  const { user_id } = await req.json() as AnalysisRequest;

  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "Missing user_id parameter" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }

  console.log(`Analyzing patterns for user: ${user_id}`);

  try {
    // Analyze the user's messages
    const analysisResult = await processUserMessages(user_id);
    
    // Store the analysis results in the database
    await storeAnalysisResults(user_id, analysisResult);

    console.log("Successfully analyzed user patterns");
    
    // Return the analysis results
    return new Response(
      JSON.stringify({
        success: true,
        message: "Analysis completed successfully",
        analysis: analysisResult
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  } catch (error) {
    console.error("Error processing analysis:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to analyze user patterns", 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
}
