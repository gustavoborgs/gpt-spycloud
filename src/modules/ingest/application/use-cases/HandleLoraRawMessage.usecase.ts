import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { IngressMessageRaw } from '../../domain/IngressMessageRaw';
import { SourceType } from '../../domain/SourceType';
import { logger } from '../../../../config/logger';

export interface HandleLoraRawMessageRequest {
  payload: any; // Everynet webhook payload
  sourceType: SourceType;
}

export class HandleLoraRawMessageUseCase implements UseCase<HandleLoraRawMessageRequest, IngressMessageRaw> {
  constructor(private repository: IngressMessageRawRepository) {}

  async execute(request: HandleLoraRawMessageRequest): Promise<Result<IngressMessageRaw>> {
    try {
      logger.debug({ payload: request.payload, sourceType: request.sourceType }, 'Processing LoRa raw message');

      // Extract device info from payload if available
      const deviceSerialNumber = request.payload.dev_eui || request.payload.deviceId;
      const rawPayload = typeof request.payload === 'string' 
        ? request.payload 
        : JSON.stringify(request.payload);

      const message = IngressMessageRaw.create({
        rawPayload,
        sourceType: request.sourceType,
        sourceIdentifier: request.payload.gateway_id || request.payload.gatewayEui,
        deviceSerialNumber,
        metadata: {
          receivedVia: 'HTTP_WEBHOOK',
          timestamp: new Date().toISOString(),
          originalPayload: request.payload,
        },
      });

      const saved = await this.repository.save(message);

      logger.info({ messageId: saved.id, deviceSerialNumber }, 'LoRa raw message saved');

      return ok(saved);
    } catch (error: any) {
      logger.error({ error, payload: request.payload }, 'Failed to handle LoRa raw message');
      return fail(error.message || 'Failed to process LoRa message', 500);
    }
  }
}

