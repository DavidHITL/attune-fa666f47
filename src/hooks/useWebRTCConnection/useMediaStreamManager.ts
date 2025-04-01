
import { useRef, useCallback } from "react";

/**
 * Hook to manage MediaStream references and access
 * @returns Methods for accessing and managing media streams
 */
export function useMediaStreamManager() {
  // Store the MediaStream reference
  const mediaStreamRef = useRef<MediaStream | null>(null);

  /**
   * Get the current active MediaStream, if available
   */
  const getActiveMediaStream = useCallback(() => {
    return mediaStreamRef.current;
  }, []);

  /**
   * Get the current active audio track, if available
   */
  const getActiveAudioTrack = useCallback(() => {
    const stream = getActiveMediaStream();
    if (!stream) return null;
    
    const tracks = stream.getAudioTracks();
    return tracks.length > 0 ? tracks[0] : null;
  }, [getActiveMediaStream]);

  /**
   * Set the active media stream
   */
  const setMediaStream = useCallback((stream: MediaStream | null) => {
    mediaStreamRef.current = stream;
  }, []);

  /**
   * Clean up the media stream by stopping all tracks
   */
  const cleanupMediaStream = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  return {
    getActiveMediaStream,
    getActiveAudioTrack,
    setMediaStream,
    cleanupMediaStream,
    mediaStreamRef
  };
}
