
/**
 * Create a new RTCPeerConnection with standard configuration
 */
export function createPeerConnection(): RTCPeerConnection {
  console.log("[PeerConnectionFactory] Creating peer connection with standard config");
  
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ],
    iceCandidatePoolSize: 10
  };
  
  console.log("[PeerConnectionFactory] Using ICE config:", JSON.stringify(config));
  
  try {
    const pc = new RTCPeerConnection(config);
    console.log("[PeerConnectionFactory] Peer connection created successfully");
    return pc;
  } catch (error) {
    console.error("[PeerConnectionFactory] Failed to create peer connection:", error);
    throw new Error(`Failed to create peer connection: ${error instanceof Error ? error.message : String(error)}`);
  }
}
