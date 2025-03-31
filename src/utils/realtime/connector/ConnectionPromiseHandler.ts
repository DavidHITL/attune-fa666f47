
/**
 * Handles connection promise creation and resolution for WebRTC connections
 */
export class ConnectionPromiseHandler {
  /**
   * Create a promise that resolves or rejects based on connection state changes
   * @param pc The RTCPeerConnection to monitor
   * @returns Promise that resolves when connection is established or rejects on failure
   */
  static createConnectionPromise(pc: RTCPeerConnection): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const connectionTimeout = setTimeout(() => {
        reject(new Error("Remote description set but connection timed out"));
      }, 10000); // 10 second timeout for connection after setting remote description
      
      const connectionStateHandler = () => {
        if (pc.connectionState === "connected") {
          clearTimeout(connectionTimeout);
          pc.removeEventListener("connectionstatechange", connectionStateHandler);
          resolve();
        } else if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          clearTimeout(connectionTimeout);
          pc.removeEventListener("connectionstatechange", connectionStateHandler);
          reject(new Error(`Connection failed with state: ${pc.connectionState}`));
        }
      };
      
      pc.addEventListener("connectionstatechange", connectionStateHandler);
    });
  }
}
