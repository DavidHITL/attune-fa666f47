
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

/**
 * Decode base64-encoded PCM16 data to Float32Array
 * This is the reverse of encodeAudioData
 */
export function decodeAudioData(base64Data: string): Float32Array {
  // Convert base64 to binary string
  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  // Convert binary string to Uint8Array
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Convert to Int16Array (PCM16 format)
  const int16Array = new Int16Array(bytes.buffer);
  
  // Convert to Float32Array (normalized between -1 and 1)
  const float32Array = new Float32Array(int16Array.length);
  for (let i = 0; i < int16Array.length; i++) {
    // Convert from Int16 to normalized Float32
    float32Array[i] = int16Array[i] >= 0 
      ? int16Array[i] / 0x7FFF 
      : int16Array[i] / 0x8000;
  }
  
  return float32Array;
}
