import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';
import { IscaFKDecoder } from './IscaFK.decoder';

/**
 * Parser for Everynet LoRaWAN payloads
 * Handles both WebSocket (uplink) and HTTP webhook formats
 */
export class EverynetPayloadParser {
  /**
   * Decode Everynet payload - tries to detect device type and use appropriate decoder
   */
  static decode(payload: any, deviceSerialNumber: string, deviceModelId?: string): DecodedTelemetry | null {
    try {
      // Handle WebSocket format (uplink message)
      if (payload.type === 'uplink' || payload.params) {
        return this.decodeUplink(payload, deviceSerialNumber, deviceModelId);
      }

      // Handle HTTP webhook format
      if (payload.payload || payload.data) {
        return this.decodeWebhook(payload, deviceSerialNumber, deviceModelId);
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode uplink message from WebSocket
   */
  private static decodeUplink(msg: any, deviceSerialNumber: string, deviceModelId?: string): DecodedTelemetry | null {
    const meta = msg?.meta || {};
    const params = msg?.params || {};
    const radio = params?.radio || {};
    const hardware = radio?.hardware || {};
    const gps = hardware?.gps || null;

    const base64Payload = params.payload;
    if (!base64Payload) {
      return null;
    }

    // Try IscaFK decoder first (if model matches or as default for now)
    if (deviceModelId === 'ISCAFK' || !deviceModelId) {
      const iscaResult = IscaFKDecoder.decode(msg, deviceSerialNumber);
      if (iscaResult) {
        return iscaResult;
      }
    }

    // Fallback: generic decoder
    return this.decodeGenericPayload(
      base64Payload,
      deviceSerialNumber,
      gps,
      {
        rssi: hardware.rssi,
        snr: hardware.snr,
        datarate: radio.datarate,
        freq: radio.freq,
        modulation: radio.modulation,
        gatewayId: meta.gateway,
        fcnt: params.counter_up,
        port: params.port,
      },
      meta.time || msg.timestamp
    );
  }

  /**
   * Decode HTTP webhook payload
   */
  private static decodeWebhook(payload: any, deviceSerialNumber: string, deviceModelId?: string): DecodedTelemetry | null {
    const base64Payload = payload.payload || payload.data;
    if (!base64Payload) {
      return null;
    }

    // Try IscaFK decoder
    if (deviceModelId === 'ISCAFK' || !deviceModelId) {
      const iscaResult = IscaFKDecoder.decode(payload, deviceSerialNumber);
      if (iscaResult) {
        return iscaResult;
      }
    }

    // Fallback: generic decoder
    return this.decodeGenericPayload(
      base64Payload,
      deviceSerialNumber,
      payload.gps || null,
      {
        rssi: payload.rssi,
        snr: payload.snr,
        gatewayId: payload.gateway_id || payload.gatewayEui,
      },
      payload.timestamp
    );
  }

  /**
   * Generic payload decoder (fallback)
   */
  private static decodeGenericPayload(
    base64Payload: string,
    deviceSerialNumber: string,
    gps: { lat?: number; lng?: number } | null,
    radioInfo: Record<string, any>,
    timestamp?: string | number
  ): DecodedTelemetry | null {
    try {
      const buffer = Buffer.from(base64Payload, 'base64');
      
      // Use gateway GPS if available
      let latitude = 0;
      let longitude = 0;
      
      if (gps?.lat != null && gps?.lng != null) {
        latitude = parseFloat(gps.lat.toString());
        longitude = parseFloat(gps.lng.toString());
      }

      return {
        deviceSerialNumber,
        timestamp: new Date(timestamp || Date.now()),
        latitude,
        longitude,
        speed: 0,
        heading: null,
        altitude: null,
        additionalData: {
          payloadHex: buffer.toString('hex'),
          payloadBase64: base64Payload,
          ...radioInfo,
        },
      };
    } catch (error) {
      return null;
    }
  }
}
