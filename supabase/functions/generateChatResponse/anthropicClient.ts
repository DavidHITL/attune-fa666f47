
/**
 * Calls the Anthropic API to get a response
 */
export async function callAnthropicAPI(
  apiKey: string, 
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  console.log("Sending request to Anthropic API");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-3-opus-20240229",
      max_tokens: 600, // Appropriate response length
      messages: messages,
      system: systemPrompt,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error("Anthropic API Error Response:", errorData);
    throw new Error(`API returned ${response.status}: ${errorData}`);
  }
  
  const data = await response.json();
  console.log("Received response from Anthropic API");

  return data.content[0].text;
}
