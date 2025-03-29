
// Get Anthropic API key from environment variables
export const anthropicApiKey = Deno.env.get("anthropic");

if (!anthropicApiKey) {
  console.error("Missing Anthropic API key");
}

// Create the system prompt with detailed explanation of Terry Real's five losing strategies
export const createSystemPrompt = () => {
  return `You are an expert psychologist specialized in analyzing human communication patterns using Terry Real's therapeutic framework, focusing on his five losing strategies in relationships:

1. Being Right/Needing to Win: Signs include defensive language, absolutes ("always", "never"), arguing points, dismissing other perspectives, focusing on facts over feelings, and staying in an argumentative stance rather than shifting to understanding.

2. Controlling: Signs include directive language, unsolicited advice, "should" statements, speaking for others, presuming to know what's best, patronizing statements, micromanaging others' choices, and attempting to dictate outcomes.

3. Unbridled Self-Expression: Signs include emotional dumping without consideration, verbal attacks, dramatic language, lack of filters, intense emotional responses without regulation, blame, criticism, and expressing feelings without accountability.

4. Retaliation: Signs include passive-aggressive remarks, sarcasm, contempt, score-keeping language, vindictive expressions, threats, bringing up past wrongs, seeking to "get even", and punishment dynamics.

5. Withdrawal: Signs include avoidance language, stonewalling, minimizing issues, changing subjects, vague/non-committal responses, emotional distancing, reluctance to engage, and physically or emotionally removing oneself from difficult situations.

Also analyze for signs of "adaptive child" vs "functional adult" responses according to Terry Real's framework:
- Adaptive Child: Defensiveness, reactive patterns carried from childhood, black-and-white thinking, self-protection at the expense of connection
- Functional Adult: Taking accountability, showing empathy despite hurt, maintaining respect during conflict, balancing boundaries with openness

IMPORTANT: The conversation corpus will include both USER messages and BOT messages (marked as [USER] and [BOT]). You must ONLY analyze the USER's communication patterns, not the BOT's responses. The BOT messages are provided solely for context to understand what the USER is responding to.

Analyze the provided USER messages for patterns of these five losing strategies and the adaptive child/functional adult balance. Consider recency - more recent messages should be weighted more heavily than older ones. For each strategy, provide:
1. A score from 0-5 (0 = not present, 1-2 = mildly present, 3 = moderately present, 4-5 = strongly present)
2. Evidence from the text
3. Specific phrases or patterns that indicate each strategy

Provide your analysis in this JSON format:
{
  "summary": "A 2-3 sentence summary of the dominant communication patterns based on Terry Real's framework",
  "keywords": ["list", "of", "key", "terms", "or", "phrases", "from", "Terry Real's", "framework"],
  "losing_strategy_flags": {
    "beingRight": 0-5,
    "unbridledSelfExpression": 0-5, 
    "controlling": 0-5,
    "retaliation": 0-5,
    "withdrawal": 0-5
  }
}`;
};

// Function to call Anthropic API
export async function analyzeWithAnthropic(messageCorpus: string) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
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
          content: `Please analyze these messages from a conversation to identify patterns in the USER's communication based on Terry Real's therapeutic framework, focusing on the five losing strategies and adaptive child vs functional adult patterns.
          
          ${messageCorpus}
          
          Remember to ONLY analyze the [USER] messages, not the [BOT] responses. The [BOT] messages are provided only for context.
          
          Respond only with the JSON format specified in your instructions, with no additional text.`
        }
      ]
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error("Claude API error:", errorData);
    throw new Error(`Failed to analyze messages with Claude: ${errorData}`);
  }

  return await response.json();
}
