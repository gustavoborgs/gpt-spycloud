import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { IngressMessageRaw } from '../../domain/IngressMessageRaw';
import { SourceType } from '../../domain/SourceType';
import { logger } from '../../../../config/logger';
import { DeviceRepository } from '../../../devices/infra/repositories/DeviceRepository';
import { getDb } from '../../../../config/db';
import { decodeGsmMessage } from '../../infra/decoders/gsm';
import { TelemetryRepository } from '../../../telemetry/infra/repositories/TelemetryRepository';
import { SaveDecodedMessageUseCase } from '../../../telemetry/application/use-cases/SaveDecodedMessage.usecase';

export interface HandleGsmRawMessageRequest {
  rawPayload: string;
  sourceIdentifier: string;
}

export class HandleGsmRawMessageUseCase implements UseCase<HandleGsmRawMessageRequest, IngressMessageRaw> {
  private deviceRepository: DeviceRepository | null = null;
  private telemetryRepository: TelemetryRepository | null = null;
  private saveTelemetryUseCase: SaveDecodedMessageUseCase | null = null;

  constructor(private repository: IngressMessageRawRepository) {}

  private getDeviceRepository(): DeviceRepository {
    if (!this.deviceRepository) {
      this.deviceRepository = new DeviceRepository(getDb());
    }
    return this.deviceRepository;
  }

  private getTelemetryRepository(): TelemetryRepository {
    if (!this.telemetryRepository) {
      this.telemetryRepository = new TelemetryRepository(getDb());
    }
    return this.telemetryRepository;
  }

  private getSaveTelemetryUseCase(): SaveDecodedMessageUseCase {
    if (!this.saveTelemetryUseCase) {
      this.saveTelemetryUseCase = new SaveDecodedMessageUseCase(this.getTelemetryRepository());
    }
    return this.saveTelemetryUseCase;
  }

  async execute(request: HandleGsmRawMessageRequest): Promise<Result<IngressMessageRaw>> {
    try {
      logger.debug({ payload: request.rawPayload, source: request.sourceIdentifier }, 'Processing GSM raw message');

      // Try to extract IMEI from payload (for IscaFK devices)
      // First, try to decode to get IMEI
      let deviceSerialNumber: string | undefined;
      let deviceModelId: string | undefined;

      // Try to decode with IscaFK decoder to extract IMEI
      try {
        const tempDecoded = decodeGsmMessage(request.rawPayload, '', 'ISCAFK_GSM');
        if (tempDecoded?.additionalData?.imei) {
          deviceSerialNumber = tempDecoded.additionalData.imei as string;
          logger.debug({ imei: deviceSerialNumber }, 'IMEI extracted from GSM payload');
        }
      } catch (error) {
        // Ignore decode errors at this stage
      }

      // If we have a serial number, try to find device to get modelId
      if (deviceSerialNumber) {
        const device = await this.getDeviceRepository().findBySerialNumber(deviceSerialNumber);
        if (device) {
          deviceModelId = device.modelId;
          logger.debug({ deviceSerialNumber, modelId: deviceModelId }, 'Device found, using model for decoding');
        } else {
          logger.debug({ deviceSerialNumber }, 'Device not found in database, will try default decoders');
        }
      }

      // Save raw message
      const message = IngressMessageRaw.create({
        rawPayload: request.rawPayload,
        sourceType: SourceType.GSM_APN,
        sourceIdentifier: request.sourceIdentifier,
        deviceSerialNumber,
        metadata: {
          receivedVia: 'TCP',
          timestamp: new Date().toISOString(),
          deviceModelId,
        },
      });

      const saved = await this.repository.save(message);

      // Try to decode and save telemetry
      if (deviceSerialNumber || deviceModelId) {
        try {
          const decoded = decodeGsmMessage(
            request.rawPayload,
            deviceSerialNumber || request.sourceIdentifier,
            deviceModelId || 'ISCAFK_GSM' // Default to IscaFK GSM if model unknown
          );

          if (decoded) {
            await this.getSaveTelemetryUseCase().execute(decoded);
            logger.info({ deviceSerialNumber, messageId: saved.id }, 'GSM message decoded and telemetry saved');
          } else {
            logger.debug({ deviceSerialNumber, messageId: saved.id }, 'GSM message could not be decoded');
          }
        } catch (decodeError: any) {
          logger.warn({ error: decodeError, deviceSerialNumber }, 'Failed to decode GSM message, but raw message was saved');
        }
      }

      logger.info({ messageId: saved.id, deviceSerialNumber }, 'GSM raw message saved');

      return ok(saved);
    } catch (error: any) {
      logger.error({ error, payload: request.rawPayload }, 'Failed to handle GSM raw message');
      return fail(error.message || 'Failed to process GSM message', 500);
    }
  }
}

