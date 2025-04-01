
/**
 * Utility class to parse and extract information from SDP (Session Description Protocol)
 * Used by WebRTC connection establishment process
 */
export class SDPParser {
  /**
   * Parse an SDP string to an object representation
   * @param sdp SDP string to parse
   */
  parseSDP(sdp: string): any {
    // Simple parsing: split the SDP into lines and create an object with sections
    const lines = sdp.split('\n');
    const sdpObject: Record<string, any> = {
      media: [],
      attributes: {}
    };
    
    let currentMedia: Record<string, any> | null = null;
    
    lines.forEach(line => {
      line = line.trim();
      
      // Parse media sections (m=)
      if (line.startsWith('m=')) {
        currentMedia = { type: line.substring(2).split(' ')[0], attributes: {} };
        sdpObject.media.push(currentMedia);
      }
      // Parse attributes (a=)
      else if (line.startsWith('a=')) {
        const parts = line.substring(2).split(':');
        const key = parts[0];
        const value = parts.length > 1 ? parts[1] : true;
        
        if (currentMedia) {
          if (!currentMedia.attributes[key]) {
            currentMedia.attributes[key] = [];
          }
          currentMedia.attributes[key].push(value);
        } else {
          if (!sdpObject.attributes[key]) {
            sdpObject.attributes[key] = [];
          }
          sdpObject.attributes[key].push(value);
        }
      }
    });
    
    return sdpObject;
  }
  
  /**
   * Get the mid value from the SDP object
   * @param sdpObject Parsed SDP object
   * @returns The mid value or 0 if not found
   */
  getMidValue(sdpObject: any): string | number {
    if (sdpObject && sdpObject.media && sdpObject.media.length > 0) {
      const audioMedia = sdpObject.media.find((m: any) => m.type === 'audio');
      
      if (audioMedia && audioMedia.attributes && audioMedia.attributes.mid && audioMedia.attributes.mid.length > 0) {
        return audioMedia.attributes.mid[0];
      }
    }
    
    // Default mid value if not found
    return 0;
  }
}
