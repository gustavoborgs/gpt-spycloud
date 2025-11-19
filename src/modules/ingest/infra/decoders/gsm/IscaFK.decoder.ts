import { DecodedTelemetry } from '../../../../telemetry/domain/DecodedTelemetry';

/**
 * Decoder for GSM IscaFK devices
 * Protocol format: binary payload (base64 or hex)
 */
export class IscaFKGsmDecoder {
  /**
   * Decode GSM IscaFK payload from base64 or hex string
   */
  static decode(rawPayload: string, deviceSerialNumber: string): DecodedTelemetry | null {
    try {
      // Clean the payload - remove whitespace and common prefixes
      const cleaned = rawPayload.trim().replace(/^HEX=/i, '').replace(/^ASCII=.*\|/i, '');
      
      // Detect if payload is base64 or hex
      // Base64: only contains A-Z, a-z, 0-9, +, /, = and length is multiple of 4
      const isB64 = /^[A-Za-z0-9+/]+={0,2}$/.test(cleaned) && cleaned.length % 4 === 0 && cleaned.length > 0;
      
      let buf: Buffer;
      if (isB64) {
        buf = Buffer.from(cleaned, 'base64');
      } else {
        // Try hex - remove all non-hex characters
        const hexOnly = cleaned.replace(/[^0-9a-fA-F]/g, '');
        if (hexOnly.length === 0 || hexOnly.length % 2 !== 0) {
          return null; // Invalid hex
        }
        buf = Buffer.from(hexOnly, 'hex');
      }

      if (buf.length < 30) {
        // Minimum expected size
        return null;
      }

      let off = 0;

      const need = (n: number, label: string) => {
        if (off + n > buf.length) {
          throw new Error(`Pacote truncado: ${label}`);
        }
      };

      const u8 = (lbl: string) => {
        need(1, lbl);
        return buf[off++];
      };

      const u16 = (lbl: string) => {
        need(2, lbl);
        return (buf[off++] << 8) | buf[off++];
      };

      const u24 = (lbl: string) => {
        need(3, lbl);
        return (buf[off++] << 16) | (buf[off++] << 8) | buf[off++];
      };

      const u32 = (lbl: string) => {
        need(4, lbl);
        return (buf[off++] << 24) | (buf[off++] << 16) | (buf[off++] << 8) | buf[off++];
      };

      const bcdToDigits = (bytes: Buffer) => {
        const out: number[] = [];
        for (const b of bytes) {
          out.push((b >> 4) & 0xf, b & 0xf);
        }
        while (out.length && out[out.length - 1] === 0xf) {
          out.pop();
        }
        return out.join('');
      };

      const crc8_itu = (data: Buffer, init = 0x00, xorout = 0x00): number => {
        let crc = init;
        for (const b of data) {
          crc ^= b;
          for (let i = 0; i < 8; i++) {
            crc = (crc & 0x80) ? ((crc << 1) ^ 0x07) & 0xff : (crc << 1) & 0xff;
          }
        }
        return (crc ^ xorout) & 0xff;
      };

      // Parse fields
      const header = u8('header');
      const ns = bcdToDigits(buf.slice(off, off + 5));
      off += 5;
      const imei = bcdToDigits(buf.slice(off, off + 7));
      off += 7;
      const fwVersion = u16('fwVersion');
      const hwVersion = u8('hwVersion');
      const protocol = u8('protocol');
      const counter = u16('counter');
      const timestamp = u32('timestamp');
      const type = u8('type');
      const loraId = u24('loraId');
      const tempRaw = u8('temperature');
      const temperatureC = +(tempRaw / 3 - 20).toFixed(2);
      const batRaw = u16('battery');
      const VBAT_SCALE = 0.01;
      const batteryV = +(batRaw * VBAT_SCALE).toFixed(2);

      // CRC validation
      const crcFieldPos = off;
      const crcField = u8('crc8_itu');
      const crcCalcStd = crc8_itu(buf.slice(0, crcFieldPos));
      let crcOk = crcCalcStd === crcField;
      let crcCalc = crcCalcStd;
      let crcNote = 'std(header..battery)';

      if (!crcOk) {
        const tries = [
          { start: 1, end: crcFieldPos, note: 'noHeader(NS..battery)' },
          { start: 6 + 7 + 2 + 1 + 1 + 2 + 4, end: crcFieldPos, note: 'from protocol..battery' },
          { start: 2, end: crcFieldPos - 4, note: 'vendor-variant A' },
          { start: 4, end: crcFieldPos + 1, note: 'vendor-variant B (inclui CRC)' },
        ];

        for (const t of tries) {
          const c = crc8_itu(buf.slice(t.start, t.end));
          if (c === crcField) {
            crcOk = true;
            crcCalc = c;
            crcNote = t.note;
            break;
          }
        }
      }

      // Flags
      const flagsHi = u8('flagsHi');
      const flagsLo = u8('flagsLo');
      const flags16 = (flagsHi << 8) | flagsLo;
      const bit = (i: number) => (flags16 >> (15 - i)) & 1;
      const batteryStatus = (bit(9) << 1) | bit(10);

      const flags = {
        emergency: !!bit(0),
        lowBattery: !!bit(1),
        jammerGsm: !!bit(2),
        jammerLora: !!bit(3),
        move: !!bit(4),
        bluetooth: !!bit(5),
        stock: !!bit(6),
        out1: !!bit(7),
        in1: !!bit(8),
        batteryStatus,
        onlinePacket: !!bit(11),
        flagsHex: '0x' + flags16.toString(16).padStart(4, '0').toUpperCase(),
      };

      const lastReset = u8('lastReset');
      const lastResetDict: Record<number, string> = {
        0x00: 'ESP_RST_UNKNOWN',
        0x01: 'ESP_RST_POWERON',
        0x02: 'ESP_RST_EXT',
        0x03: 'ESP_RST_SW',
        0x04: 'ESP_RST_PANIC',
        0x05: 'ESP_RST_INT_WDT',
        0x06: 'ESP_RST_TASK_WDT',
        0x07: 'ESP_RST_WDT',
        0x08: 'ESP_RST_DEEPSLEEP',
        0x09: 'ESP_RST_BROWNOUT',
        0x0a: 'ESP_RST_SDIO',
        0x0b: 'ESP_RST_USB',
        0x0c: 'ESP_RST_JTAG',
        0x0d: 'ESP_RST_EFUSE',
        0x0e: 'ESP_RST_PWR_GLITCH',
        0x0f: 'ESP_RST_CPU_LOCKUP',
      };

      const nErbs = u8('nErbs');

      // Convert timestamp to Date
      const dateIso = new Date(timestamp * 1000);

      // Note: GSM payload doesn't include GPS coordinates directly
      // GPS would need to come from another source or be inferred
      // For now, we'll set to 0 and include in additionalData that GPS is not available
      return {
        deviceSerialNumber: imei || deviceSerialNumber, // Use IMEI if available
        timestamp: dateIso,
        latitude: 0, // GPS not in payload
        longitude: 0, // GPS not in payload
        speed: 0,
        heading: null,
        altitude: null,
        ignition: flags.move, // Use movement flag as proxy
        additionalData: {
          ns,
          imei,
          fwVersion,
          hwVersion,
          protocol,
          counter,
          timestamp,
          timestampIso: dateIso.toISOString(),
          type,
          loraId: `0x${loraId.toString(16).toUpperCase()}`,
          loraIdDecimal: loraId,
          temperatureC,
          tempRaw,
          batteryV,
          batteryRaw: batRaw,
          flags,
          lastReset,
          lastResetReason: lastResetDict[lastReset] || `UNKNOWN_0x${lastReset.toString(16)}`,
          nErbs,
          crcOk,
          crcNote,
          crcField,
          crcCalc,
          header,
          payloadFormat: isB64 ? 'base64' : 'hex',
          payloadHex: buf.toString('hex'),
        },
      };
    } catch (error: any) {
      return null;
    }
  }
}

