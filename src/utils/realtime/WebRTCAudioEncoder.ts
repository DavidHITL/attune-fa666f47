
/**
 * Encode audio data for sending to OpenAI
 * Converts Float32Array to base64-encoded PCM16 data
 */
export function encodeAudioData(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  
  // Convert Float32Array to Int16Array
  for (let i = 0; i < float32Array.length; i++) {
    // Clamp values between -1 and 1
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    // Convert to 16-bit PCM
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  // Convert to Uint8Array for binary encoding
  const uint8Array = new Uint8Array(int16Array.buffer);
  let binary = '';
  const chunkSize = 0x8000;
  
  // Process in chunks to avoid call stack limits
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  // Return base64 encoded string
  return btoa(binary);
}
