import { ModelADecoder } from './ModelA.decoder';
import { ModelBDecoder } from './ModelB.decoder';
import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';
import { DEVICE_MODEL_CAPABILITIES } from '../../../../../shared/mapping/deviceModelCapabilities';

export function decodeGsmMessage(
  rawPayload: string,
  deviceSerialNumber: string,
  modelId: string
): DecodedTelemetry | null {
  const model = DEVICE_MODEL_CAPABILITIES[modelId];
  if (!model) {
    return null;
  }

  switch (model.decoder) {
    case 'ModelA':
      return ModelADecoder.decode(rawPayload, deviceSerialNumber);
    case 'ModelB':
      return ModelBDecoder.decode(rawPayload, deviceSerialNumber);
    default:
      return null;
  }
}

