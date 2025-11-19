import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';

/**
 * Decoder for GSM Model B devices
 * Example format: JSON-like structure
 */
export class ModelBDecoder {
  static decode(rawPayload: string, deviceSerialNumber: string): DecodedTelemetry | null {
    try {
      const data = JSON.parse(rawPayload);

      if (!data.lat || !data.lng) {
        return null;
      }

      return {
        deviceSerialNumber,
        timestamp: new Date(data.timestamp || Date.now()),
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lng),
        speed: data.speed ? parseFloat(data.speed) : 0,
        heading: data.heading ? parseFloat(data.heading) : null,
        altitude: data.altitude ? parseFloat(data.altitude) : null,
        ignition: data.ignition === true || data.ignition === 1,
        fuelLevel: data.fuelLevel ? parseFloat(data.fuelLevel) : null,
        additionalData: data,
      };
    } catch (error) {
      return null;
    }
  }
}

