import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';

/**
 * Decoder for GSM Model A devices
 * Example format: "IMEI:123456789|LAT:-23.5505|LON:-46.6333|SPD:60|IGN:1"
 */
export class ModelADecoder {
  static decode(rawPayload: string, deviceSerialNumber: string): DecodedTelemetry | null {
    try {
      const parts = rawPayload.split('|');
      const data: any = {};

      parts.forEach((part) => {
        const [key, value] = part.split(':');
        if (key && value) {
          data[key.toLowerCase()] = value;
        }
      });

      if (!data.lat || !data.lon) {
        return null;
      }

      return {
        deviceSerialNumber,
        timestamp: new Date(),
        latitude: parseFloat(data.lat),
        longitude: parseFloat(data.lon),
        speed: data.spd ? parseFloat(data.spd) : 0,
        heading: data.hdg ? parseFloat(data.hdg) : null,
        altitude: data.alt ? parseFloat(data.alt) : null,
        ignition: data.ign === '1',
        additionalData: {
          imei: data.imei,
          ...data,
        },
      };
    } catch (error) {
      return null;
    }
  }
}

