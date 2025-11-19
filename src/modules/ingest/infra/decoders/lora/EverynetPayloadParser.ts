import { DecodedTelemetry } from '../../../telemetry/domain/DecodedTelemetry';

/**
 * Parser for Everynet LoRaWAN payloads
 */
export class EverynetPayloadParser {
  static decode(payload: any, deviceSerialNumber: string): DecodedTelemetry | null {
    try {
      // Everynet typically sends payload in base64 or hex
      const payloadData = payload.payload || payload.data;
      if (!payloadData) {
        return null;
      }

      // Decode base64 payload (example - adjust based on actual format)
      const buffer = Buffer.from(payloadData, 'base64');
      
      // Example parsing (adjust based on actual device protocol)
      // Assuming format: [lat(4 bytes)][lon(4 bytes)][speed(2 bytes)][flags(1 byte)]
      if (buffer.length < 11) {
        return null;
      }

      const lat = buffer.readInt32BE(0) / 1000000;
      const lon = buffer.readInt32BE(4) / 1000000;
      const speed = buffer.readUInt16BE(8);
      const flags = buffer.readUInt8(10);
      const ignition = (flags & 0x01) === 1;

      return {
        deviceSerialNumber,
        timestamp: new Date(payload.timestamp || Date.now()),
        latitude: lat,
        longitude: lon,
        speed: speed,
        heading: null,
        altitude: null,
        ignition,
        additionalData: {
          rssi: payload.rssi,
          snr: payload.snr,
          gatewayId: payload.gateway_id,
        },
      };
    } catch (error) {
      return null;
    }
  }
}

