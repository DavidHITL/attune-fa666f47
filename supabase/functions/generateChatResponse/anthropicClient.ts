
/**
 * Calls the OpenAI API to get a response
 */
export async function callAnthropicAPI(
  apiKey: string, 
  messages: Array<{ role: string; content: string }>,
  systemPrompt: string
): Promise<string> {
  console.log("Sending request to OpenAI API");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      max_tokens: 600, // Appropriate response length
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.text();
    console.error("OpenAI API Error Response:", errorData);
    throw new Error(`API returned ${response.status}: ${errorData}`);
  }
  
  const data = await response.json();
  console.log("Received response from OpenAI API");

  return data.choices[0].message.content;
}
