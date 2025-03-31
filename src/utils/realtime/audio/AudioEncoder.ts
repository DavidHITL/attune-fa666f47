
/**
 * Utilities for encoding audio data
 */
export class AudioEncoder {
  /**
   * Convert Float32Array to base64 for sending to API
   */
  static encodeAudioData(float32Array: Float32Array): string {
    // Convert Float32Array to Int16Array
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1]
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to Int16
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // Convert to Uint8Array for transmission
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = '';
    const chunkSize = 0x8000;
    
    // Process in chunks to avoid call stack size exceeded
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    return btoa(binary);
  }
}
