
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
