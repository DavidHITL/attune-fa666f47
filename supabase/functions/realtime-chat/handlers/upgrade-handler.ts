
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
    
    // Try to upgrade without protocols first - simpler and more reliable approach
    try {
      console.log("[Upgrade Handler] Attempting WebSocket upgrade without protocols");
      const upgradeResult = Deno.upgradeWebSocket(req, {
        idleTimeout: SOCKET_TIMEOUT
      });
      
      console.log("[Upgrade Handler] Upgrade successful with protocol:", 
                 upgradeResult.socket.protocol || "none");
      return upgradeResult;
    } catch (upgradeError) {
      console.error("[Upgrade Handler] Upgrade failed:", upgradeError);
      
      return new Response(JSON.stringify({
        error: "WebSocket upgrade failed",
        details: upgradeError instanceof Error ? upgradeError.message : String(upgradeError)
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("[Upgrade Handler] Error during upgrade handling:", error);
    return createErrorResponse(error);
  }
}
