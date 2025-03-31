
/**
 * CORS headers for edge function responses
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

/**
 * Generate formatted error response
 */
export function createErrorResponse(message: string, status = 500): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status: status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Check if WebSocket upgrade is requested in headers
 */
export function isWebSocketUpgrade(headers: Headers): boolean {
  const upgradeHeader = headers.get('upgrade');
  return !!upgradeHeader && upgradeHeader.toLowerCase() === 'websocket';
}

/**
 * Log message with timestamp
 */
export function logWithTimestamp(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  
  switch(level) {
    case 'error':
      console.error(`[${timestamp}] ${message}`);
      break;
    case 'warn':
      console.warn(`[${timestamp}] ${message}`);
      break;
    default:
      console.log(`[${timestamp}] ${message}`);
  }
}
