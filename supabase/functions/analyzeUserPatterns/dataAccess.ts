
import { supabaseAdmin } from "./supabaseClient.ts";
import { Message, AnalysisResponse } from "./types.ts";

// Fetch user messages from the database
export async function fetchUserMessages(userId: string): Promise<Message[]> {
  console.log(`Fetching messages for user: ${userId}`);

  const { data: messages, error: messagesError } = await supabaseAdmin
    .from('messages')
    .select('content, created_at, sender_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    console.error("Error fetching messages:", messagesError);
    throw new Error(`Failed to fetch user messages: ${messagesError.message}`);
  }

  return messages;
}

// Store analysis results in the database
export async function storeAnalysisResults(userId: string, analysisResult: AnalysisResponse): Promise<void> {
  console.log("Storing analysis results for user:", userId);
  
  const { error: insertError } = await supabaseAdmin
    .from('analysis_results')
    .insert({
      user_id: userId,
      summary_text: analysisResult.summary,
      keywords: analysisResult.keywords,
      losing_strategy_flags: analysisResult.losing_strategy_flags
    });

  if (insertError) {
    console.error("Error storing analysis results:", insertError);
    throw new Error(`Failed to store analysis results: ${insertError.message}`);
  }
}
