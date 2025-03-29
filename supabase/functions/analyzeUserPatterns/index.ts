
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

// Define types for API responses and request parameters
interface AnalysisRequest {
  user_id: string;
}

interface AnalysisResponse {
  summary: string;
  keywords: string[];
  losing_strategy_flags: {
    beingRight: number;
    unbridledSelfExpression: number;
    controlling: number;
    retaliation: number;
    withdrawal: number;
  }
}

interface Message {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  sender_type: string;
}

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const anthropicApiKey = Deno.env.get("anthropic");

if (!anthropicApiKey) {
  console.error("Missing Anthropic API key");
}

// Create a Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;

// Create a Supabase client with service role key for elevated access
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create the system prompt with detailed explanation of Terry Real's five losing strategies
const createSystemPrompt = () => {
  return `You are an expert psychologist specialized in analyzing human communication patterns, specifically Terry Real's five losing strategies in relationships:

1. Being Right/Needing to Win: Signs include defensive language, absolutes ("always", "never"), arguing points, dismissing other perspectives, focusing on facts over feelings.

2. Controlling: Signs include directive language, unsolicited advice, "should" statements, speaking for others, presuming to know what's best, patronizing statements, micromanaging.

3. Unbridled Self-Expression: Signs include emotional dumping, verbal attacks, dramatic language, lack of filters, intense emotional responses, blame, criticism.

4. Retaliation: Signs include passive-aggressive remarks, sarcasm, contempt, score-keeping language, vindictive expressions, threats, bringing up past wrongs, seeking to "get even".

5. Withdrawal: Signs include avoidance language, stonewalling, minimizing issues, changing subjects, vague/non-committal responses, emotional distancing, reluctance to engage.

Analyze the provided messages for patterns of these five losing strategies. Consider recency - more recent messages should be weighted more heavily than older ones. For each strategy, provide:
1. A score from 0-5 (0 = not present, 1-2 = mildly present, 3 = moderately present, 4-5 = strongly present)
2. Evidence from the text
3. Specific phrases or patterns that indicate each strategy

Provide your analysis in this JSON format:
{
  "summary": "A 2-3 sentence summary of the dominant communication patterns",
  "keywords": ["list", "of", "key", "terms", "or", "phrases"],
  "losing_strategy_flags": {
    "beingRight": 0-5,
    "unbridledSelfExpression": 0-5, 
    "controlling": 0-5,
    "retaliation": 0-5,
    "withdrawal": 0-5
  }
}`;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Fetch user messages from the database
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('content, created_at, sender_type')
      .eq('user_id', user_id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch user messages", details: messagesError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Filter only the user's messages (not the AI responses)
    const userMessages = messages.filter(msg => msg.sender_type === 'user' && msg.content);

    if (userMessages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages found for this user" }),
        { 
          status: 404, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Create a text corpus from the messages for Claude to analyze
    const messageCorpus = userMessages
      .map(msg => `[${new Date(msg.created_at).toLocaleString()}] ${msg.content}`)
      .join("\n\n");

    console.log(`Found ${userMessages.length} messages to analyze`);

    // Call Claude API to analyze the messages
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        system: createSystemPrompt(),
        messages: [
          {
            role: "user",
            content: `Please analyze these messages from a user to identify patterns of Terry Real's five losing strategies:
            
            ${messageCorpus}
            
            Respond only with the JSON format specified in your instructions, with no additional text.`
          }
        ]
      })
    });

    if (!anthropicResponse.ok) {
      const errorData = await anthropicResponse.text();
      console.error("Claude API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Failed to analyze messages with Claude", details: errorData }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Parse the analysis from Claude
    const claudeData = await anthropicResponse.json();
    const analysisText = claudeData.content[0].text;
    
    let analysisResult: AnalysisResponse;
    try {
      // Extract JSON from Claude's response
      const jsonMatch = analysisText.match(/\{[\s\S]+\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from Claude's response");
      }
      analysisResult = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error("Error parsing Claude response:", parseError);
      console.log("Response content:", analysisText);
      return new Response(
        JSON.stringify({ error: "Failed to parse analysis results", details: parseError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    console.log("Successfully analyzed user patterns");
    
    // Store the analysis results in the analysis_results table
    const { error: insertError } = await supabaseAdmin
      .from('analysis_results')
      .insert({
        user_id: user_id,
        summary_text: analysisResult.summary,
        keywords: analysisResult.keywords,
        losing_strategy_flags: analysisResult.losing_strategy_flags
      });

    if (insertError) {
      console.error("Error storing analysis results:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to store analysis results", details: insertError }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

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
    console.error("Error in analyzeUserPatterns function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
