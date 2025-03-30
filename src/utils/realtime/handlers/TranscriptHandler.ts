
/**
 * Handles transcript updates and processing
 */
export class TranscriptHandler {
  private lastTranscriptUpdate: number = 0;
  private transcriptCallback: (text: string) => void;

  constructor(transcriptCallback: (text: string) => void) {
    this.transcriptCallback = transcriptCallback;
  }

  /**
   * Update transcript with new text
   */
  updateTranscript(text: string): void {
    this.lastTranscriptUpdate = Date.now();
    this.transcriptCallback(text);
  }

  /**
   * Get the timestamp of the last transcript update
   */
  getLastUpdateTime(): number {
    return this.lastTranscriptUpdate;
  }
}
