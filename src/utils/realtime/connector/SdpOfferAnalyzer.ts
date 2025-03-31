
/**
 * Utility for analyzing SDP offers and extracting information about media sections
 */
export class SdpOfferAnalyzer {
  /**
   * Analyze SDP offer and log relevant information
   * @param sdp The SDP offer string
   */
  static analyzeSdpOffer(sdp: string | undefined): void {
    if (!sdp) {
      console.warn("[SdpOfferAnalyzer] SDP offer is empty!");
      return;
    }
    
    console.log("[SdpOfferAnalyzer] SDP offer created with length:", sdp.length);
    
    // Check for audio media section in the SDP
    const hasAudioSection = sdp.includes("m=audio");
    console.log("[SdpOfferAnalyzer] SDP contains audio media section:", hasAudioSection);
    
    if (hasAudioSection) {
      // Extract and log the audio media section for debugging
      const audioSectionMatch = sdp.match(/m=audio.*(?:\r\n|\r|\n)(?:.*(?:\r\n|\r|\n))*/);
      if (audioSectionMatch) {
        console.log("[SdpOfferAnalyzer] Audio section details:", audioSectionMatch[0]);
      }
    } else {
      console.warn("[SdpOfferAnalyzer] WARNING: No audio media section found in SDP offer!");
    }
    
    // Log the first and last few lines of the SDP for debugging
    const sdpLines = sdp.split("\n");
    const firstLines = sdpLines.slice(0, 5).join("\n");
    const lastLines = sdpLines.slice(-5).join("\n");
    console.log("[SdpOfferAnalyzer] SDP offer preview (first 5 lines):\n", firstLines);
    console.log("[SdpOfferAnalyzer] SDP offer preview (last 5 lines):\n", lastLines);
  }
}
