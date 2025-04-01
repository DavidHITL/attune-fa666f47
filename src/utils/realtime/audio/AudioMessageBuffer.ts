
/**
 * Manages buffering of audio data for current message
 */
export class AudioMessageBuffer {
  private audioBuffers: Uint8Array[] = [];
  
  /**
   * Add audio chunk to the buffer
   */
  public addChunk(chunk: Uint8Array): void {
    this.audioBuffers.push(chunk);
  }
  
  /**
   * Clear the buffer
   */
  public clear(): void {
    this.audioBuffers = [];
  }
  
  /**
   * Get buffer size
   */
  public getSize(): number {
    return this.audioBuffers.length;
  }
  
  /**
   * Combine all chunks into one buffer
   */
  public combineChunks(): Uint8Array {
    if (this.audioBuffers.length === 0) {
      return new Uint8Array(0);
    }
    
    // Calculate total length
    const totalLength = this.audioBuffers.reduce((sum, chunk) => sum + chunk.length, 0);
    const combinedBuffer = new Uint8Array(totalLength);
    
    // Copy chunks into combined buffer
    let offset = 0;
    for (const chunk of this.audioBuffers) {
      combinedBuffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    return combinedBuffer;
  }
}
