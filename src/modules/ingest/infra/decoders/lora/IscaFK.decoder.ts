import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';

/**
 * Decoder for IscaFK LoRaWAN devices
 * Protocol format based on Everynet WebSocket payload structure
 */
export class IscaFKDecoder {
  static decode(payload: any, deviceSerialNumber: string): DecodedTelemetry | null {
    try {
      // Handle both WebSocket (uplink) and HTTP webhook formats
      const params = payload?.params || {};
      const base64Payload = params.payload || payload.payload || payload.data;
      
      if (!base64Payload) {
        return null;
      }

      // Decode base64 to buffer
      const buffer = Buffer.from(base64Payload, 'base64');
      
      if (buffer.length < 9) {
        return null;
      }

      // Parse according to IscaFK protocol
      // [protocol(1)][loraId(3)][temp(1)][vbat(2)][flags(2)]
      const protocol = buffer.readUInt8(0);
      
      const loraId = (buffer.readUInt8(1) << 16) | (buffer.readUInt8(2) << 8) | buffer.readUInt8(3);
      
      let temp = buffer.readInt8(4); // signed int8
      
      const vbatRaw = (buffer.readUInt8(5) << 8) | buffer.readUInt8(6);
      const VBAT_SCALE = 0.001;
      const vbat = +(vbatRaw * VBAT_SCALE).toFixed(3);

      // Flags (byte0 and byte1)
      const byte0 = buffer.readUInt8(8);
      const byte1 = buffer.readUInt8(7);

      const flags = {
        emergency: (byte0 & 0b00000001) !== 0,
        lowBattery: (byte0 & 0b00000010) !== 0,
        jammer: (byte0 & 0b00000100) !== 0,
        movement: (byte0 & 0b00001000) !== 0,
        bleStatus: (byte0 & 0b00010000) !== 0,
        stockMode: (byte0 & 0b00100000) !== 0,
        output: (byte0 & 0b01000000) !== 0,
        input: (byte0 & 0b10000000) !== 0,
        statusBattery0: (byte1 & 0b00000001) !== 0,
        statusBattery1: (byte1 & 0b00000010) !== 0,
        lastResetReason0: (byte1 & 0b00000100) !== 0,
        lastResetReason1: (byte1 & 0b00001000) !== 0,
        lastResetReason2: (byte1 & 0b00010000) !== 0,
        lastResetReason3: (byte1 & 0b00100000) !== 0,
        lastResetReason4: (byte1 & 0b01000000) !== 0,
        reserved: (byte1 & 0b10000000) !== 0,
      };

      // Extract GPS from gateway (if available)
      // Handle both WebSocket format (params.radio) and HTTP webhook format
      const radio = params?.radio || payload?.radio || {};
      const hardware = radio?.hardware || payload?.hardware || {};
      const gps = hardware?.gps || payload?.gps || null;

      // Extract RF info
      const rssi = hardware?.rssi || payload?.rssi;
      const snr = hardware?.snr || payload?.snr;
      const datarate = radio?.datarate || payload?.datarate;
      const freq = radio?.freq || payload?.freq;
      const modulation = radio?.modulation || payload?.modulation || {};

      // Use gateway GPS as approximate location if device GPS is not available
      let latitude = 0;
      let longitude = 0;
      
      if (gps?.lat != null && gps?.lng != null) {
        latitude = parseFloat(gps.lat);
        longitude = parseFloat(gps.lng);
      }

      // Extract metadata (for WebSocket format) or use direct fields (for HTTP webhook)
      const meta = payload?.meta || {};
      const timestamp = meta.time || params.timestamp || payload.timestamp || Date.now();
      const gatewayId = meta.gateway || params.gateway_id || payload.gateway_id || payload.gatewayEui || null;
      const fcnt = params.counter_up || payload.fcnt || null;
      const port = params.port || payload.port || null;

      return {
        deviceSerialNumber,
        timestamp: new Date(timestamp),
        latitude,
        longitude,
        speed: 0, // IscaFK doesn't provide speed
        heading: null,
        altitude: null,
        ignition: flags.movement, // Use movement flag as proxy for activity
        additionalData: {
          protocol,
          loraId: `0x${loraId.toString(16).toUpperCase()}`,
          loraIdDecimal: loraId,
          temperatureC: temp,
          vbatV: vbat,
          vbatRaw,
          flags,
          rssi,
          snr,
          datarate,
          freq,
          spreadingFactor: modulation.spreading,
          bandwidth: modulation.bandwidth,
          coderate: modulation.coderate,
          gatewayId,
          fcnt,
          port,
          locationSource: gps ? 'gateway' : 'unknown',
          payloadHex: buffer.toString('hex'),
        },
      };
    } catch (error) {
      return null;
    }
  }
}

