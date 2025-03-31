
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
      
      // For development/testing purposes, use a hardcoded API key or fetch from an env variable
      // NOTE: In production, you should NEVER expose API keys in the client-side code
      // Instead, use a secure backend endpoint to generate tokens
      
      let apiKey = '';
      
      // In browser environments, don't use process.env
      if (typeof window !== 'undefined') {
        // Check if there's a configured API key in localStorage or elsewhere
        const storedKey = localStorage.getItem('OPENAI_API_KEY');
        if (storedKey) {
          apiKey = storedKey;
        }
      }
      
      if (!apiKey) {
        // For development only - this should be replaced with a secure endpoint
        // that generates tokens without exposing API keys to the client
        console.log("[DirectConnectionManager] No API key found, using demo endpoint");
        
        try {
          // In a real application, this would be a call to your backend
          const response = await fetch("/api/generate-realtime-token", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              voice: voice,
              instructions: instructions
            }),
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          this.sessionId = data.id || "demo-session-id";
          this.clientSecret = data.client_secret || "demo-client-secret";
          
          // For demo purposes only
          if (!data.id) {
            console.warn("[DirectConnectionManager] Using fallback demo values");
          }
          
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
          // In a real implementation, this call should NOT be made directly from the client
          // This is shown for development purposes only
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
