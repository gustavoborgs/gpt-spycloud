import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { IngressMessageRaw } from '../../domain/IngressMessageRaw';
import { SourceType } from '../../domain/SourceType';
import { logger } from '../../../../config/logger';

export interface HandleGsmRawMessageRequest {
  rawPayload: string;
  sourceIdentifier: string;
}

export class HandleGsmRawMessageUseCase implements UseCase<HandleGsmRawMessageRequest, IngressMessageRaw> {
  constructor(private repository: IngressMessageRawRepository) {}

  async execute(request: HandleGsmRawMessageRequest): Promise<Result<IngressMessageRaw>> {
    try {
      logger.debug({ payload: request.rawPayload, source: request.sourceIdentifier }, 'Processing GSM raw message');

      const message = IngressMessageRaw.create({
        rawPayload: request.rawPayload,
        sourceType: SourceType.GSM_APN,
        sourceIdentifier: request.sourceIdentifier,
        metadata: {
          receivedVia: 'TCP',
          timestamp: new Date().toISOString(),
        },
      });

      const saved = await this.repository.save(message);

      logger.info({ messageId: saved.id }, 'GSM raw message saved');

      return ok(saved);
    } catch (error: any) {
      logger.error({ error, payload: request.rawPayload }, 'Failed to handle GSM raw message');
      return fail(error.message || 'Failed to process GSM message', 500);
    }
  }
}

