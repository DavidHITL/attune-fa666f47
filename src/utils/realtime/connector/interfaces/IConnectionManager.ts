
import { AudioPlaybackManager } from "../../audio/AudioPlaybackManager";

export interface IConnectionManager {
  connect(apiKey: string, audioTrack?: MediaStreamTrack): Promise<boolean>;
  disconnect(): void;
  getConnectionState(): RTCPeerConnectionState;
  isDataChannelReady(): boolean;
  sendTextMessage(text: string): boolean;
  commitAudioBuffer(): boolean;
  setAudioPlaybackManager?(manager: AudioPlaybackManager): void;
}
