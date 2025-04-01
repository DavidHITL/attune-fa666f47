
/**
 * Utilities for converting between different audio formats
 */
export class AudioFormatConverter {
  /**
   * Decode base64 audio to binary data
   */
  public static decodeBase64Audio(base64Audio: string): Uint8Array {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      console.error("[AudioFormatConverter] Error decoding base64 audio:", error);
      return new Uint8Array(0);
    }
  }

  /**
   * Create WAV format from PCM data
   */
  public static createWavFromPCM(pcmData: Uint8Array): Uint8Array {
    // PCM data is 16-bit samples, little-endian
    const numSamples = pcmData.length / 2;
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;
    
    // Create buffer for WAV header + data
    const buffer = new ArrayBuffer(44 + pcmData.length);
    const view = new DataView(buffer);
    
    // Write WAV header
    // "RIFF" chunk
    AudioFormatConverter.writeString(view, 0, "RIFF");
    view.setUint32(4, fileSize, true);
    AudioFormatConverter.writeString(view, 8, "WAVE");
    
    // "fmt " chunk
    AudioFormatConverter.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" chunk
    AudioFormatConverter.writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);
    
    // Copy PCM data
    const pcmView = new Uint8Array(buffer, 44);
    pcmView.set(pcmData);
    
    return new Uint8Array(buffer);
  }

  /**
   * Helper function to write strings to DataView
   */
  private static writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}
