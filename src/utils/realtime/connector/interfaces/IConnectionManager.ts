
import { AudioPlaybackManager } from "../../audio/AudioPlaybackManager";
import { WebRTCOptions } from "../../WebRTCTypes";

/**
 * Interface for WebRTC connection managers
 */
export interface IConnectionManager {
  /**
   * Connect to the OpenAI Realtime API
   * @param apiKey OpenAI API key
   * @param audioTrack Optional audio track to add to the connection
   * @returns Promise resolving to a boolean indicating success or failure
   */
  connect(apiKey: string, audioTrack?: MediaStreamTrack): Promise<boolean>;
  
  /**
   * Disconnect from the OpenAI Realtime API
   */
  disconnect(): void;
  
  /**
   * Send a text message to the OpenAI Realtime API
   * @param text The text message to send
   * @returns Boolean indicating success or failure
   */
  sendTextMessage(text: string): boolean;
  
  /**
   * Commit the audio buffer to indicate the end of user speech
   * @returns Boolean indicating success or failure
   */
  commitAudioBuffer(): boolean;
  
  /**
   * Check if the data channel is ready for sending messages
   * @returns Boolean indicating whether the data channel is ready
   */
  isDataChannelReady(): boolean;
  
  /**
   * Get the current connection state
   * @returns The current RTCPeerConnectionState
   */
  getConnectionState(): RTCPeerConnectionState;
  
  /**
   * Set the audio playback manager
   * @param manager The audio playback manager to use
   */
  setAudioPlaybackManager(manager: AudioPlaybackManager): void;
  
  /**
   * Get the audio playback manager
   * @returns The current audio playback manager or null if not set
   */
  getAudioPlaybackManager(): AudioPlaybackManager | null;
  
  /**
   * Get the options used to initialize this manager
   * @returns The WebRTCOptions used to initialize this manager
   */
  getOptions(): WebRTCOptions;
}
