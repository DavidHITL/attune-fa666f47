
/**
 * Manages audio tracks for WebRTC connections
 */
export class AudioTrackManager {
  /**
   * Add an audio track to the peer connection
   * @param pc The RTCPeerConnection to add the track to
   * @param audioTrack Optional audio track to add
   * @returns Promise resolving to a boolean indicating if a track was successfully added
   */
  static async addAudioTrack(pc: RTCPeerConnection, audioTrack?: MediaStreamTrack): Promise<boolean> {
    // If an audio track is provided, add it directly
    if (audioTrack) {
      console.log("[AudioTrackManager] Adding provided audio track to peer connection:", 
        audioTrack.label || "Unnamed track", 
        "- Enabled:", audioTrack.enabled, 
        "- ID:", audioTrack.id);
      
      // Create a new MediaStream with the audio track
      const mediaStream = new MediaStream([audioTrack]);
      
      // Add the track to the peer connection, associating it with the stream
      const sender = pc.addTrack(audioTrack, mediaStream);
      console.log("[AudioTrackManager] Audio track added successfully with sender ID:", sender.track?.id || "unknown");
      return true;
    } 
    
    // If no audio track provided, try to get one from microphone
    try {
      console.log("[AudioTrackManager] No audio track provided, requesting microphone access");
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000 // OpenAI recommends this sample rate
        } 
      });
      
      const audioTracks = mediaStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const micTrack = audioTracks[0];
        console.log("[AudioTrackManager] Adding microphone track to peer connection:", 
          micTrack.label || "Unnamed microphone", 
          "- Enabled:", micTrack.enabled, 
          "- ID:", micTrack.id);
        
        // Add the first audio track from the microphone to the peer connection
        const sender = pc.addTrack(micTrack, mediaStream);
        console.log("[AudioTrackManager] Microphone track added successfully with sender ID:", sender.track?.id || "unknown");
        return true;
      } else {
        console.warn("[AudioTrackManager] No audio tracks found in media stream");
        return false;
      }
    } catch (micError) {
      console.warn("[AudioTrackManager] Could not access microphone, continuing without audio track:", micError);
      // Continue without microphone - we'll use data channel for text and can add tracks later if needed
      return false;
    }
  }
}
