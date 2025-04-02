
// Fix for the ArrayBufferView error

export class ConnectionManager {
  private dataChannel: RTCDataChannel | null = null;
  
  // Method to set the active data channel
  setDataChannel(channel: RTCDataChannel | null): void {
    this.dataChannel = channel;
  }
  
  // Method to send data through the data channel
  sendData(data: string | ArrayBuffer | Blob): boolean {
    if (this.dataChannel && this.dataChannel.readyState === "open") {
      // Convert string to ArrayBuffer if needed
      if (typeof data === 'string') {
        const encoder = new TextEncoder();
        const arrayBuffer = encoder.encode(data).buffer;
        const arrayBufferView = new Uint8Array(arrayBuffer);
        this.dataChannel.send(arrayBufferView);
      } else if (data instanceof ArrayBuffer) {
        // Convert ArrayBuffer to ArrayBufferView
        const arrayBufferView = new Uint8Array(data);
        this.dataChannel.send(arrayBufferView);
      } else {
        // For Blob data, send as is
        this.dataChannel.send(data);
      }
      return true;
    }
    return false;
  }
  
  // Check if the data channel is ready
  isReady(): boolean {
    return !!this.dataChannel && this.dataChannel.readyState === "open";
  }
  
  // Cleanup method to close the data channel
  cleanup(): void {
    if (this.dataChannel) {
      if (this.dataChannel.readyState !== "closed") {
        this.dataChannel.close();
      }
      this.dataChannel = null;
    }
  }
}
