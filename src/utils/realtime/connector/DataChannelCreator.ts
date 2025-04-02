
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
      
      // Enhanced data channel options for better reliability
      const dataChannelOptions: RTCDataChannelInit = {
        ordered: true,
        // For critical channels like 'oai-events', add reliability options
        ...(label === 'oai-events' && {
          maxRetransmits: 10,
          maxPacketLifeTime: 3000  // 3 seconds max lifetime for retransmissions
        })
      };
      
      const dc = pc.createDataChannel(label, dataChannelOptions);
      setupDataChannelListeners(dc, options, onOpen);
      
      // Add monitoring for data channel state changes
      const monitorChannel = () => {
        if (dc) {
          const state = dc.readyState;
          console.log(`[DataChannelCreator] Channel '${label}' state: ${state}`);
          
          if (state === 'open') {
            console.log(`[DataChannelCreator] Channel '${label}' successfully opened`);
          }
        }
      };
      
      // Check channel state after creation and after a short delay
      monitorChannel();
      setTimeout(monitorChannel, 500);
      
      return dc;
    } catch (error) {
      console.error(`[DataChannelCreator] Error creating data channel '${label}':`, error);
      return null;
    }
  }
}
