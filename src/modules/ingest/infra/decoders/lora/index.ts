import { EverynetPayloadParser } from './EverynetPayloadParser';
import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';

export function decodeLoraMessage(
  payload: any,
  deviceSerialNumber: string,
  sourceType: string
): DecodedTelemetry | null {
  switch (sourceType) {
    case 'LORAWAN_EVERYNET':
      return EverynetPayloadParser.decode(payload, deviceSerialNumber);
    // Add more LoRa decoders as needed
    default:
      return null;
  }
}

