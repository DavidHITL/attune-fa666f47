
import { corsHeaders, createErrorResponse, logWithTimestamp } from "../utils.ts";
import { WebSocketOptions, defaultOptions } from "../types.ts";

/**
 * Handle WebSocket upgrade requests 
 */
export async function handleUpgrade(req: Request): Promise<Deno.UpgradeWebSocketResult | Response> {  
  try {
    logWithTimestamp("[Upgrade Handler] Processing WebSocket upgrade request");
    
    // Log all request headers for debugging
    const headerEntries = Array.from(req.headers.entries());
    logWithTimestamp("[Upgrade Handler] Request headers: " + 
                     JSON.stringify(Object.fromEntries(headerEntries), null, 2));
    
    // Check if request is a valid WebSocket upgrade
    const upgradeHeader = req.headers.get("upgrade") || "";
    const connectionHeader = req.headers.get("connection") || "";
    const secWebSocketKey = req.headers.get("sec-websocket-key");
    
    if (upgradeHeader.toLowerCase() !== "websocket") {
      logWithTimestamp("[Upgrade Handler] Not a valid WebSocket upgrade request. Upgrade header: " + upgradeHeader, "error");
      return createErrorResponse("Expected WebSocket upgrade", 400);
    }
    
    if (!connectionHeader.toLowerCase().includes("upgrade")) {
      logWithTimestamp("[Upgrade Handler] Connection header does not include 'upgrade': " + connectionHeader, "error");
      return createErrorResponse("Expected 'upgrade' in Connection header", 400);
    }
    
    if (!secWebSocketKey) {
      logWithTimestamp("[Upgrade Handler] Missing Sec-WebSocket-Key header", "error");
      return createErrorResponse("Missing Sec-WebSocket-Key header", 400);
    }
    
    // Extract any requested WebSocket subprotocol
    const protocolHeader = req.headers.get("sec-websocket-protocol");
    const requestedProtocols = protocolHeader ? protocolHeader.split(",").map(p => p.trim()) : undefined;
    logWithTimestamp("[Upgrade Handler] Requested protocols: " + (requestedProtocols ? requestedProtocols.join(", ") : "none"));
    
    // Extended timeout for debugging
    const SOCKET_TIMEOUT = 120000; // 2 minutes
    
    // Try to upgrade with specific options
    try {
      logWithTimestamp("[Upgrade Handler] Attempting WebSocket upgrade");
      const upgradeResult = Deno.upgradeWebSocket(req, {
        idleTimeout: SOCKET_TIMEOUT,
        protocol: requestedProtocols?.[0] // Use first protocol if available
      });
      
      logWithTimestamp("[Upgrade Handler] Upgrade successful with protocol: " + 
                   (upgradeResult.socket.protocol || "none"));
      return upgradeResult;
    } catch (upgradeError) {
      logWithTimestamp("[Upgrade Handler] Upgrade failed: " + (upgradeError instanceof Error ? upgradeError.stack || upgradeError.message : String(upgradeError)), "error");
      
      return createErrorResponse(
        "WebSocket upgrade failed: " + (upgradeError instanceof Error ? upgradeError.message : String(upgradeError)), 
        500
      );
    }
  } catch (error) {
    logWithTimestamp("[Upgrade Handler] Error during upgrade handling: " + (error instanceof Error ? error.stack || error.message : String(error)), "error");
    return createErrorResponse("Error during WebSocket upgrade: " + (error instanceof Error ? error.message : String(error)));
  }
}
