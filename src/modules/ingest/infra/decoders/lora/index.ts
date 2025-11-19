import { EverynetPayloadParser } from './EverynetPayloadParser';
import { IscaFKDecoder } from './IscaFK.decoder';
import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';
import { DEVICE_MODEL_CAPABILITIES } from '../../../../../shared/mapping/deviceModelCapabilities';

export function decodeLoraMessage(
  payload: any,
  deviceSerialNumber: string,
  sourceType: string,
  deviceModelId?: string
): DecodedTelemetry | null {
  switch (sourceType) {
    case 'LORAWAN_EVERYNET':
      // If we have a modelId, check which decoder to use
      if (deviceModelId) {
        const model = DEVICE_MODEL_CAPABILITIES[deviceModelId];
        if (model && model.decoder === 'IscaFK') {
          return IscaFKDecoder.decode(payload, deviceSerialNumber);
        }
      }
      
      // Try IscaFK as default for Everynet (can be adjusted)
      const iscaResult = IscaFKDecoder.decode(payload, deviceSerialNumber);
      if (iscaResult) {
        return iscaResult;
      }

      // Fallback to generic Everynet parser
      return EverynetPayloadParser.decode(payload, deviceSerialNumber, deviceModelId);
    
    // Add more LoRa decoders as needed
    default:
      return null;
  }
}

