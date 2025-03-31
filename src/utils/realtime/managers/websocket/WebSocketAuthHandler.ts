
/**
 * Handles WebSocket authentication
 */
export class WebSocketAuthHandler {
  /**
   * Get authenticated URL with token if available
   */
  async getAuthenticatedUrl(baseUrl: string): Promise<string> {
    let finalUrl = baseUrl;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data } = await supabase.auth.getSession();
      
      if (data.session?.access_token) {
        console.log("[WebSocketAuthHandler] Adding auth token to connection");
        // Add token to URL as a query parameter
        const separator = finalUrl.includes('?') ? '&' : '?';
        finalUrl = `${finalUrl}${separator}token=${data.session.access_token}`;
      }
    } catch (error) {
      console.warn("[WebSocketAuthHandler] Could not get auth token:", error);
    }
    
    return finalUrl;
  }
}
