
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
    
    // Log all request headers for debugging
    console.log("[WebSocket Handler] Request headers:", 
      JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
    
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
    
    let upgradeResult;
    try {
      // Extended timeout - helpful for debugging
      const SOCKET_TIMEOUT = 120000; // 2 minutes
      
      // Try to upgrade with requested protocols first
      console.log("[WebSocket Handler] Attempting WebSocket upgrade with protocols:", requestedProtocols || "none");
      upgradeResult = Deno.upgradeWebSocket(req, {
        protocol: requestedProtocols && requestedProtocols.length > 0 ? requestedProtocols[0] : undefined,
        idleTimeout: SOCKET_TIMEOUT,
      });
      
      console.log("[WebSocket Handler] Upgrade successful with protocol:", 
                 upgradeResult.socket.protocol || "none");
    } catch (upgradeError) {
      console.error("[WebSocket Handler] Critical: WebSocket upgrade failed:", upgradeError);
      console.error("[WebSocket Handler] Error details:", JSON.stringify({
        name: upgradeError.name,
        message: upgradeError.message,
        stack: upgradeError.stack
      }, null, 2));
      
      // Try again without protocols if the initial attempt failed
      try {
        console.log("[WebSocket Handler] Retrying upgrade without protocols");
        upgradeResult = Deno.upgradeWebSocket(req);
        console.log("[WebSocket Handler] Fallback upgrade successful");
      } catch (fallbackError) {
        console.error("[WebSocket Handler] Fallback upgrade also failed:", fallbackError);
        return new Response(JSON.stringify({ 
          error: "WebSocket upgrade failed", 
          details: "Could not establish WebSocket connection",
          originalError: upgradeError instanceof Error ? upgradeError.message : String(upgradeError),
          fallbackError: fallbackError instanceof Error ? fallbackError.message : String(fallbackError)
        }), { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
    }
    
    const { socket, response } = upgradeResult;
    
    try {
      // Set up immediate error and close handlers for debugging
      socket.onerror = (event) => {
        console.error("[WebSocket Handler] Socket error:", event);
      };

      socket.onclose = (event) => {
        console.log(`[WebSocket Handler] Socket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}, Clean: ${event.wasClean}`);
      };

      // Send immediate confirmation to client
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
          } catch (pingError) {
            console.error("[WebSocket Handler] Error sending ping:", pingError);
            clearInterval(pingInterval);
          }
        } else {
          console.log("[WebSocket Handler] Stopping pings, socket state:", socket.readyState);
          clearInterval(pingInterval);
        }
      }, 30000);
      
      // Set up OpenAI connection with improved error handling
      try {
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
        
        // Clean up resources on close
        const originalOnClose = socket.onclose;
        socket.onclose = (event) => {
          clearInterval(pingInterval);
          console.log("[WebSocket Handler] Cleared ping interval due to socket close");
          
          if (originalOnClose) {
            originalOnClose.call(socket, event);
          }
        };
      } catch (setupError) {
        console.error("[WebSocket Handler] Error during OpenAI setup:", setupError);
        try {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ 
              type: "error", 
              error: "Error setting up OpenAI connection",
              details: setupError instanceof Error ? setupError.message : String(setupError),
              time: new Date().toISOString()
            }));
          }
        } catch (notifyError) {
          console.error("[WebSocket Handler] Failed to notify client of setup error:", notifyError);
        }
      }
      
      return response;
    } catch (connectionError) {
      console.error("[WebSocket Handler] Error during connection handling:", connectionError);
      console.error("[WebSocket Handler] Error details:", JSON.stringify({
        name: connectionError.name,
        message: connectionError.message,
        stack: connectionError.stack
      }, null, 2));
      
      try {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ 
            type: "error", 
            error: "Error during connection setup",
            details: connectionError instanceof Error ? connectionError.message : String(connectionError),
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
    console.error("[WebSocket Handler] Error details:", JSON.stringify({
      name: topLevelError.name,
      message: topLevelError.message,
      stack: topLevelError.stack
    }, null, 2));
    
    return createErrorResponse(topLevelError);
  }
}
