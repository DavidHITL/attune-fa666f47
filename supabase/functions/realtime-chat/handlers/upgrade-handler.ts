
import { corsHeaders, createErrorResponse } from "../utils.ts";
import { WebSocketOptions, defaultOptions } from "../types.ts";

/**
 * Handle WebSocket upgrade requests 
 */
export async function handleUpgrade(req: Request): Promise<Deno.UpgradeWebSocketResult | Response> {  
  try {
    console.log("[Upgrade Handler] Processing WebSocket upgrade request");
    
    // Log all request headers for debugging
    console.log("[Upgrade Handler] Request headers:", 
      JSON.stringify(Object.fromEntries(req.headers.entries()), null, 2));
    
    // Check if request is a valid WebSocket upgrade
    const upgradeHeader = req.headers.get("upgrade") || "";
    if (upgradeHeader.toLowerCase() !== "websocket") {
      console.error("[Upgrade Handler] Not a valid WebSocket upgrade request. Upgrade header:", upgradeHeader);
      return new Response("Expected WebSocket upgrade", { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    // Extract any requested WebSocket subprotocol and log it
    const protocolHeader = req.headers.get("sec-websocket-protocol");
    const requestedProtocols = protocolHeader ? protocolHeader.split(",").map(p => p.trim()) : undefined;
    console.log("[Upgrade Handler] Requested protocols:", requestedProtocols || "none");
    
    // Extended timeout - helpful for debugging
    const SOCKET_TIMEOUT = 120000; // 2 minutes
    
    return upgradeWebSocket(req, requestedProtocols, SOCKET_TIMEOUT);
  } catch (error) {
    console.error("[Upgrade Handler] Error during upgrade handling:", error);
    return createErrorResponse(error);
  }
}

/**
 * Attempt to upgrade the connection to WebSocket with fallback
 */
async function upgradeWebSocket(
  req: Request, 
  requestedProtocols?: string[], 
  idleTimeout = 120000
): Promise<Deno.UpgradeWebSocketResult | Response> {
  try {
    // Try to upgrade with requested protocols first
    console.log("[Upgrade Handler] Attempting WebSocket upgrade with protocols:", requestedProtocols || "none");
    const upgradeResult = Deno.upgradeWebSocket(req, {
      protocol: requestedProtocols && requestedProtocols.length > 0 ? requestedProtocols[0] : undefined,
      idleTimeout,
    });
    
    console.log("[Upgrade Handler] Upgrade successful with protocol:", 
               upgradeResult.socket.protocol || "none");
    return upgradeResult;
  } catch (upgradeError) {
    console.error("[Upgrade Handler] Critical: WebSocket upgrade failed:", upgradeError);
    console.error("[Upgrade Handler] Error details:", JSON.stringify({
      name: upgradeError.name,
      message: upgradeError.message,
      stack: upgradeError.stack
    }, null, 2));
    
    // Try again without protocols if the initial attempt failed
    try {
      console.log("[Upgrade Handler] Retrying upgrade without protocols");
      const upgradeResult = Deno.upgradeWebSocket(req);
      console.log("[Upgrade Handler] Fallback upgrade successful");
      return upgradeResult;
    } catch (fallbackError) {
      console.error("[Upgrade Handler] Fallback upgrade also failed:", fallbackError);
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
}
