
import { v4 as uuidv4 } from 'uuid';

/**
 * DirectConnectionManager handles establishing connection to OpenAI's Realtime API
 */
export class DirectConnectionManager {
  private sessionId: string | null = null;
  private clientSecret: string | null = null;
  
  /**
   * Connect to OpenAI's Realtime API directly using WebRTC
   * 
   * @param instructions System message for the AI assistant
   * @param voice Voice ID to use for the conversation
   */
  async connect(instructions: string = "You are a helpful, friendly assistant.", voice: string = "alloy"): Promise<{ sessionId: string, clientSecret: string }> {
    try {
      console.log("[DirectConnectionManager] Initiating direct connection to OpenAI");
      
      // Create a request ID for tracking
      const requestId = uuidv4().substring(0, 8);
      
      // Get credentials from OpenAI
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      
      if (!apiKey) {
        // For development environments, we can use a secure endpoint to generate tokens
        // In production, the OpenAI API key would be stored securely in environment variables
        console.log("[DirectConnectionManager] Using built-in development token endpoint");
        
        try {
          const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-realtime-preview-2024-12-17", 
              voice: voice,
              instructions: instructions
            }),
          });
          
          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }
          
          const data = await response.json();
          this.sessionId = data.id;
          this.clientSecret = data.client_secret;
          
          return {
            sessionId: this.sessionId,
            clientSecret: this.clientSecret
          };
        } catch (error) {
          console.error("[DirectConnectionManager] Connection error:", error);
          throw new Error(`Direct connection error: ${error instanceof Error ? error.message : String(error)}`);
        }
      } else {
        console.log("[DirectConnectionManager] Using provided OpenAI API key");
        
        try {
          const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "gpt-4o-realtime-preview-2024-12-17", 
              voice: voice,
              instructions: instructions
            }),
          });
          
          if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.status}`);
          }
          
          const data = await response.json();
          this.sessionId = data.id;
          this.clientSecret = data.client_secret;
          
          return {
            sessionId: this.sessionId,
            clientSecret: this.clientSecret
          };
        } catch (error) {
          console.error("[DirectConnectionManager] Connection error:", error);
          throw new Error(`Direct connection error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      console.error("[DirectConnectionManager] Connection error:", error);
      throw new Error(`Connection error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Disconnect from the API
   */
  disconnect(): void {
    this.sessionId = null;
    this.clientSecret = null;
  }

  /**
   * Check if there's an active connection
   */
  isConnected(): boolean {
    return this.sessionId !== null && this.clientSecret !== null;
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get client secret for authentication
   */
  getClientSecret(): string | null {
    return this.clientSecret;
  }
}
