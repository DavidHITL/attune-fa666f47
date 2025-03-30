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
    console.log("Request URL:", req.url);
    console.log("Request headers:", JSON.stringify(Object.fromEntries(req.headers.entries())));
    
    // Check if request is a valid WebSocket upgrade
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() !== "websocket") {
      console.error("Not a valid WebSocket upgrade request. Upgrade header:", upgradeHeader);
      return new Response("Expected WebSocket upgrade", { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Extract authentication token from URL if present
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    
    if (token) {
      console.log("Authentication token provided in WebSocket connection");
      // You can validate the token here if needed
    }
    
    // Extract any requested WebSocket subprotocol
    const protocolHeader = req.headers.get("sec-websocket-protocol");
    const requestedProtocols = protocolHeader ? protocolHeader.split(",").map(p => p.trim()) : undefined;
    
    if (requestedProtocols && requestedProtocols.length > 0) {
      console.log("Client requested WebSocket subprotocols:", requestedProtocols);
    }
    
    let upgradeResult;
    try {
      // Upgrade the connection to WebSocket, passing along any requested protocols
      console.log("Attempting to upgrade connection to WebSocket with protocols:", requestedProtocols);
      upgradeResult = Deno.upgradeWebSocket(req, {
        protocol: requestedProtocols ? requestedProtocols[0] : undefined
      });
      
      console.log("WebSocket upgrade successful" + 
                 (upgradeResult.socket.protocol ? ` with protocol: ${upgradeResult.socket.protocol}` : ""));
    } catch (upgradeError) {
      console.error("Critical: WebSocket upgrade failed with error:", upgradeError);
      console.error("Error details:", JSON.stringify({
        name: upgradeError.name,
        message: upgradeError.message,
        stack: upgradeError.stack
      }));
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
      // Set up initial socket error handler
      socket.onerror = (event) => {
        console.error("WebSocket error after upgrade:", event);
        try {
          socket.send(JSON.stringify({
            type: "error",
            error: "WebSocket connection error",
            time: new Date().toISOString()
          }));
        } catch (e) {
          console.error("Failed to send error message to client:", e);
        }
      };

      socket.onclose = (event) => {
        console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason || "No reason provided"}`);
      };

      try {
        const OPENAI_API_KEY = getOpenAIApiKey();
        console.log("API key retrieved successfully");
        
        console.log("WebSocket connection established with client");
        
        let openAISocket: WebSocket | null = null;
        let connectionAttempts = 0;
        const maxConnectionAttempts = options.reconnectAttempts || defaultOptions.reconnectAttempts;
        let reconnectTimeout: number | undefined;
        
        // Start server-side heartbeat for keep-alive
        const pingInterval = setInterval(() => {
          try {
            if (socket.readyState === WebSocket.OPEN) {
              console.log("Sending server ping to client");
              socket.send(JSON.stringify({
                type: "ping",
                timestamp: new Date().toISOString()
              }));
            } else {
              console.log("Stopping server pings, socket state:", socket.readyState);
              clearInterval(pingInterval);
            }
          } catch (error) {
            console.error("Error sending server ping:", error);
            clearInterval(pingInterval);
          }
        }, 30000); // Send ping every 30 seconds
        
        // Send confirmation message to client
        try {
          socket.send(JSON.stringify({ 
            type: "connection.established", 
            message: "WebSocket connection established", 
            time: new Date().toISOString() 
          }));
          console.log("Sent connection established message to client");
        } catch (sendError) {
          console.error("Error sending confirmation message:", sendError);
          console.error("Error details:", JSON.stringify({
            name: sendError.name,
            message: sendError.message,
            stack: sendError.stack
          }));
        }
        
        // Set up client connection handlers with detailed error handling
        try {
          console.log("Setting up client connection handlers...");
          setupClientConnectionHandlers({
            socket,
            openAISocketRef: { current: openAISocket },
            reconnectTimeoutRef: { current: reconnectTimeout },
            connectionAttemptsRef: { current: connectionAttempts },
            maxConnectionAttempts,
          });
          console.log("Client connection handlers set up successfully");
        } catch (handlerError) {
          console.error("Failed to set up client connection handlers:", handlerError);
          console.error("Handler error details:", JSON.stringify({
            name: handlerError.name,
            message: handlerError.message,
            stack: handlerError.stack
          }));
          try {
            socket.send(JSON.stringify({
              type: "error",
              error: "Failed to set up client connection handlers",
              details: handlerError instanceof Error ? handlerError.message : String(handlerError),
              time: new Date().toISOString()
            }));
          } catch (sendError) {
            console.error("Failed to send error notification to client:", sendError);
          }
        }
        
        // Connect to OpenAI Realtime API with detailed error handling
        try {
          console.log("Setting up OpenAI connection...");
          setupOpenAIConnection({
            socket,
            apiKey: OPENAI_API_KEY,
            openAISocketRef: { current: openAISocket },
            reconnectTimeoutRef: { current: reconnectTimeout },
            connectionAttemptsRef: { current: connectionAttempts },
            maxConnectionAttempts,
          });
          console.log("OpenAI connection setup initiated successfully");
        } catch (openAIError) {
          console.error("Failed to set up OpenAI connection:", openAIError);
          console.error("OpenAI error details:", JSON.stringify({
            name: openAIError.name,
            message: openAIError.message,
            stack: openAIError.stack
          }));
          try {
            socket.send(JSON.stringify({ 
              type: "error", 
              error: "Failed to establish connection with OpenAI",
              details: openAIError instanceof Error ? openAIError.message : String(openAIError),
              time: new Date().toISOString()
            }));
          } catch (sendError) {
            console.error("Failed to send error message to client:", sendError);
          }
        }
        
        // Add cleanup for heartbeat when socket closes
        const originalOnClose = socket.onclose;
        socket.onclose = (event) => {
          clearInterval(pingInterval);
          console.log("Cleared server-side ping interval due to socket close");
          
          // Call the original onclose handler if it exists
          if (originalOnClose) {
            originalOnClose.call(socket, event);
          }
        };
        
        console.log("WebSocket handler completed successfully, returning response");
        return response;
      } catch (setupError) {
        console.error("Error during connection setup:", setupError);
        console.error("Setup error details:", JSON.stringify({
          name: setupError.name,
          message: setupError.message,
          stack: setupError.stack
        }));
        try {
          socket.send(JSON.stringify({ 
            type: "error", 
            error: "Error during connection setup",
            details: setupError instanceof Error ? setupError.message : String(setupError),
            time: new Date().toISOString()
          }));
        } catch (sendError) {
          console.error("Failed to send error notification to client:", sendError);
        }
        return response;
      }
    } catch (error) {
      console.error("WebSocket handler error:", error);
      console.error("Error details:", JSON.stringify({
        name: error.name,
        message: error.message,
        stack: error.stack
      }));
      return createErrorResponse(error);
    }
  } catch (topLevelError) {
    console.error("Top-level WebSocket handler error:", topLevelError);
    console.error("Error details:", JSON.stringify({
      name: topLevelError.name,
      message: topLevelError.message,
      stack: topLevelError.stack
    }));
    return createErrorResponse(topLevelError);
  }
}
