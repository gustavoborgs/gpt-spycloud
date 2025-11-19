import { ModelADecoder } from './ModelA.decoder';
import { ModelBDecoder } from './ModelB.decoder';
import { IscaFKGsmDecoder } from './IscaFK.decoder';
import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';
import { DEVICE_MODEL_CAPABILITIES } from '../../../../../shared/mapping/deviceModelCapabilities';

export function decodeGsmMessage(
  rawPayload: string,
  deviceSerialNumber: string,
  modelId: string
): DecodedTelemetry | null {
  const model = DEVICE_MODEL_CAPABILITIES[modelId];
  if (!model) {
    // Try IscaFK as fallback if model not found (for auto-detection)
    const iscaResult = IscaFKGsmDecoder.decode(rawPayload, deviceSerialNumber);
    if (iscaResult) {
      return iscaResult;
    }
    return null;
  }

  switch (model.decoder) {
    case 'ModelA':
      return ModelADecoder.decode(rawPayload, deviceSerialNumber);
    case 'ModelB':
      return ModelBDecoder.decode(rawPayload, deviceSerialNumber);
    case 'IscaFK':
      return IscaFKGsmDecoder.decode(rawPayload, deviceSerialNumber);
    default:
      // Try IscaFK as fallback
      const iscaResult = IscaFKGsmDecoder.decode(rawPayload, deviceSerialNumber);
      if (iscaResult) {
        return iscaResult;
      }
      return null;
  }
}

