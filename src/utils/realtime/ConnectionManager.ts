// Fix for the ArrayBufferView error

// Replace this:
if (this.dataChannel && this.dataChannel.readyState === "open") {
  this.dataChannel.send(data);
  return true;
}

// With this version that ensures data is properly converted:
if (this.dataChannel && this.dataChannel.readyState === "open") {
  // Convert string to ArrayBuffer if needed
  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    const arrayBuffer = encoder.encode(data).buffer;
    this.dataChannel.send(arrayBuffer);
  } else {
    // For non-string data, send as is
    this.dataChannel.send(data);
  }
  return true;
}
