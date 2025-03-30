
import { corsHeaders, getOpenAIApiKey } from "./utils.ts";
import { WebSocketOptions, defaultOptions, createErrorResponse, MutableRef, ConnectionHandlerOptions } from "./types.ts";
import { setupClientConnectionHandlers } from "./client-handler.ts";
import { setupOpenAIConnection } from "./openai-handler.ts";

/**
 * Handle WebSocket upgrade requests and manage the connection to OpenAI's Realtime API
 */
export async function handleWebSocketRequest(req: Request, options: WebSocketOptions = defaultOptions): Promise<Response> {
  try {
    console.log("Processing WebSocket upgrade request for OpenAI Realtime API");
    
    // Check if request is a valid WebSocket upgrade
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() !== "websocket") {
      console.error("Not a valid WebSocket upgrade request");
      return new Response("Expected WebSocket upgrade", { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    try {
      // Upgrade the connection to WebSocket
      const upgradeResult = Deno.upgradeWebSocket(req);
      console.log("WebSocket upgrade successful");
      
      const { socket, response } = upgradeResult;
      const OPENAI_API_KEY = getOpenAIApiKey();
      
      console.log("WebSocket connection established with client");
      
      let openAISocket: WebSocket | null = null;
      let connectionAttempts = 0;
      const maxConnectionAttempts = options.reconnectAttempts || defaultOptions.reconnectAttempts;
      let reconnectTimeout: number | undefined;
      
      // Send confirmation message to client
      try {
        socket.send(JSON.stringify({ type: "connection.established", message: "WebSocket connection established" }));
      } catch (err) {
        console.error("Error sending confirmation message:", err);
      }
      
      // Set up client connection handlers
      setupClientConnectionHandlers({
        socket,
        openAISocketRef: { current: openAISocket },
        reconnectTimeoutRef: { current: reconnectTimeout },
        connectionAttemptsRef: { current: connectionAttempts },
        maxConnectionAttempts,
      });
      
      // Connect to OpenAI Realtime API
      setupOpenAIConnection({
        socket,
        apiKey: OPENAI_API_KEY,
        openAISocketRef: { current: openAISocket },
        reconnectTimeoutRef: { current: reconnectTimeout },
        connectionAttemptsRef: { current: connectionAttempts },
        maxConnectionAttempts,
      });
      
      return response;
    } catch (upgradeError) {
      console.error("Failed to upgrade WebSocket connection:", upgradeError);
      return new Response(JSON.stringify({ 
        error: "WebSocket upgrade failed", 
        details: upgradeError instanceof Error ? upgradeError.message : String(upgradeError) 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
  } catch (error) {
    console.error("WebSocket handler error:", error);
    return createErrorResponse(error);
  }
}
