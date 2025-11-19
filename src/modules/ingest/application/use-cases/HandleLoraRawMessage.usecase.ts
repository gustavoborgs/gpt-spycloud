import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { IngressMessageRaw } from '../../domain/IngressMessageRaw';
import { SourceType } from '../../domain/SourceType';
import { logger } from '../../../../config/logger';
import { DeviceRepository } from '../../../devices/infra/repositories/DeviceRepository';
import { getDb } from '../../../../config/db';
import { decodeLoraMessage } from '../../infra/decoders/lora';
import { TelemetryRepository } from '../../../telemetry/infra/repositories/TelemetryRepository';
import { SaveDecodedMessageUseCase } from '../../../telemetry/application/use-cases/SaveDecodedMessage.usecase';

export interface HandleLoraRawMessageRequest {
  payload: any; // Everynet webhook payload
  sourceType: SourceType;
}

export class HandleLoraRawMessageUseCase implements UseCase<HandleLoraRawMessageRequest, IngressMessageRaw> {
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

  async execute(request: HandleLoraRawMessageRequest): Promise<Result<IngressMessageRaw>> {
    try {
      logger.debug({ payload: request.payload, sourceType: request.sourceType }, 'Processing LoRa raw message');

      // Extract device info from payload
      // Everynet can send dev_eui in meta.device or params.device or directly
      const deviceSerialNumber = 
        request.payload.meta?.device || 
        request.payload.params?.device ||
        request.payload.dev_eui || 
        request.payload.deviceId ||
        request.payload.device;

      if (!deviceSerialNumber) {
        logger.warn({ payload: request.payload }, 'No device identifier found in LoRa payload');
      }

      const rawPayload = typeof request.payload === 'string' 
        ? request.payload 
        : JSON.stringify(request.payload);

      // Try to find device to get modelId
      let deviceModelId: string | undefined;
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
        rawPayload,
        sourceType: request.sourceType,
        sourceIdentifier: request.payload.meta?.gateway || request.payload.gateway_id || request.payload.gatewayEui,
        deviceSerialNumber,
        metadata: {
          receivedVia: request.payload.type === 'uplink' ? 'WEBSOCKET' : 'HTTP_WEBHOOK',
          timestamp: new Date().toISOString(),
          originalPayload: request.payload,
          deviceModelId,
        },
      });

      const saved = await this.repository.save(message);

      // Try to decode and save telemetry
      if (deviceSerialNumber) {
        try {
          const decoded = decodeLoraMessage(
            request.payload,
            deviceSerialNumber,
            request.sourceType,
            deviceModelId
          );

          if (decoded) {
            await this.getSaveTelemetryUseCase().execute(decoded);
            logger.info({ deviceSerialNumber, messageId: saved.id }, 'LoRa message decoded and telemetry saved');
          } else {
            logger.debug({ deviceSerialNumber, messageId: saved.id }, 'LoRa message could not be decoded');
          }
        } catch (decodeError: any) {
          logger.warn({ error: decodeError, deviceSerialNumber }, 'Failed to decode LoRa message, but raw message was saved');
        }
      }

      logger.info({ messageId: saved.id, deviceSerialNumber }, 'LoRa raw message saved');

      return ok(saved);
    } catch (error: any) {
      logger.error({ error, payload: request.payload }, 'Failed to handle LoRa raw message');
      return fail(error.message || 'Failed to process LoRa message', 500);
    }
  }
}

