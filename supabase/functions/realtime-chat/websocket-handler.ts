import { corsHeaders, getOpenAIApiKey, createErrorResponse } from "./utils.ts";
import { WebSocketOptions, defaultOptions, MutableRef, ConnectionHandlerOptions } from "./types.ts";
import { setupClientConnectionHandlers } from "./client-handler.ts";
import { setupOpenAIConnection } from "./openai-handler.ts";

/**
 * Handle WebSocket upgrade requests and manage the connection to OpenAI's Realtime API
 */
export async function handleWebSocketRequest(req: Request, options: WebSocketOptions = defaultOptions): Promise<Response> {
  // Allow CORS preflight for websockets
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        ...corsHeaders,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, sec-websocket-protocol, upgrade"
      }
    });
  }
  
  try {
    console.log("[WebSocket Handler] Processing WebSocket upgrade request");
    
    // Check if request is a valid WebSocket upgrade
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() !== "websocket") {
      console.error("[WebSocket Handler] Not a valid WebSocket upgrade request. Upgrade header:", upgradeHeader);
      return new Response("Expected WebSocket upgrade", { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Extract any requested WebSocket subprotocol and log it
    const protocolHeader = req.headers.get("sec-websocket-protocol");
    const requestedProtocols = protocolHeader ? protocolHeader.split(",").map(p => p.trim()) : undefined;
    console.log("[WebSocket Handler] Requested protocols:", requestedProtocols || "none");
    
    // Log all headers for debugging
    console.log("[WebSocket Handler] Request headers:", 
      JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
    
    let upgradeResult;
    try {
      // Upgrade the connection with requested protocol if available
      console.log("[WebSocket Handler] Attempting WebSocket upgrade");
      upgradeResult = Deno.upgradeWebSocket(req, {
        protocol: requestedProtocols && requestedProtocols.length > 0 ? requestedProtocols[0] : undefined,
        idleTimeout: 120000, // 2 minutes idle timeout
      });
      
      console.log("[WebSocket Handler] Upgrade successful, protocol:", 
                 upgradeResult.socket.protocol || "none");
    } catch (upgradeError) {
      console.error("[WebSocket Handler] Critical: WebSocket upgrade failed:", upgradeError);
      return new Response(JSON.stringify({ 
        error: "WebSocket upgrade failed", 
        details: upgradeError instanceof Error ? upgradeError.message : String(upgradeError) 
      }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    const { socket, response } = upgradeResult;
    
    try {
      // Set up basic error and close handlers immediately
      socket.onerror = (event) => {
        console.error("[WebSocket Handler] Socket error:", event);
      };

      socket.onclose = (event) => {
        console.log(`[WebSocket Handler] Socket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
      };

      // Send confirmation message immediately after upgrade
      try {
        socket.send(JSON.stringify({ 
          type: "connection.established", 
          message: "WebSocket connection established",
          protocol: socket.protocol || "none",
          time: new Date().toISOString() 
        }));
        console.log("[WebSocket Handler] Sent connection confirmation");
      } catch (sendError) {
        console.error("[WebSocket Handler] Error sending confirmation:", sendError);
      }
      
      // Set up ping interval for keep-alive
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          try {
            socket.send(JSON.stringify({
              type: "ping",
              timestamp: new Date().toISOString()
            }));
            console.log("[WebSocket Handler] Sent keep-alive ping");
          } catch (error) {
            console.error("[WebSocket Handler] Error sending ping:", error);
            clearInterval(pingInterval);
          }
        } else {
          console.log("[WebSocket Handler] Stopping pings, socket state:", socket.readyState);
          clearInterval(pingInterval);
        }
      }, 30000); // 30-second ping interval
      
      // Set up OpenAI connection and client handlers
      const OPENAI_API_KEY = getOpenAIApiKey();
      
      let openAISocket: WebSocket | null = null;
      let connectionAttempts = 0;
      const maxConnectionAttempts = options.reconnectAttempts || defaultOptions.reconnectAttempts;
      let reconnectTimeout: number | undefined;
      
      const handlerOptions: ConnectionHandlerOptions = {
        socket, 
        apiKey: OPENAI_API_KEY,
        openAISocketRef: { current: openAISocket },
        reconnectTimeoutRef: { current: reconnectTimeout },
        connectionAttemptsRef: { current: connectionAttempts },
        maxConnectionAttempts
      };
      
      // Set up client message handlers
      setupClientConnectionHandlers(handlerOptions);
      
      // Connect to OpenAI
      setupOpenAIConnection(handlerOptions);
      
      // Clean up on close
      const originalOnClose = socket.onclose;
      socket.onclose = (event) => {
        clearInterval(pingInterval);
        console.log("[WebSocket Handler] Cleared ping interval due to socket close");
        
        if (originalOnClose) {
          originalOnClose.call(socket, event);
        }
      };
      
      return response;
    } catch (error) {
      console.error("[WebSocket Handler] Error during connection setup:", error);
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            type: "error", 
            error: "Error during connection setup",
            details: error instanceof Error ? error.message : String(error),
            time: new Date().toISOString()
          }));
        }
      } catch (e) {
        console.error("[WebSocket Handler] Failed to send error message:", e);
      }
      return response;
    }
  } catch (topLevelError) {
    console.error("[WebSocket Handler] Top-level error:", topLevelError);
    return createErrorResponse(topLevelError);
  }
}
