
import { WebRTCOptions } from "../WebRTCTypes";
import { setupDataChannelListeners } from "../WebRTCDataChannelHandler";

/**
 * Creates and configures WebRTC data channels
 */
export class DataChannelCreator {
  /**
   * Create a data channel with the specified configuration
   * @param pc The RTCPeerConnection to create the data channel on
   * @param label Label for the data channel
   * @param options WebRTC options
   * @param onOpen Callback for when the data channel opens
   * @returns The created data channel or null if creation failed
   */
  static createDataChannel(
    pc: RTCPeerConnection, 
    label: string = "data",
    options: WebRTCOptions,
    onOpen?: () => void
  ): RTCDataChannel | null {
    try {
      console.log(`[DataChannelCreator] Creating data channel: ${label}`);
      
      const dataChannelOptions: RTCDataChannelInit = {
        ordered: true,
      };
      
      const dc = pc.createDataChannel(label, dataChannelOptions);
      setupDataChannelListeners(dc, options, onOpen);
      
      return dc;
    } catch (error) {
      console.error(`[DataChannelCreator] Error creating data channel '${label}':`, error);
      return null;
    }
  }
}
