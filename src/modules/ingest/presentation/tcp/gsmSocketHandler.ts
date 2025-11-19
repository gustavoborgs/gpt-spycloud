import { GsmMessage } from '../../../../infra/tcp/gsmServer';
import { HandleGsmRawMessageUseCase } from '../../application/use-cases/HandleGsmRawMessage.usecase';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { getDb } from '../../../../config/db';
import { logger } from '../../../../config/logger';

export class GsmSocketHandler {
  private handleGsmMessageUseCase: HandleGsmRawMessageUseCase | null = null;

  private getHandleGsmMessageUseCase(): HandleGsmRawMessageUseCase {
    if (!this.handleGsmMessageUseCase) {
      const repository = new IngressMessageRawRepository(getDb());
      this.handleGsmMessageUseCase = new HandleGsmRawMessageUseCase(repository);
    }
    return this.handleGsmMessageUseCase;
  }

  async handleMessage(message: GsmMessage): Promise<void> {
    try {
      // The raw payload can be hex or base64
      // The decoder will detect the format automatically
      const result = await this.getHandleGsmMessageUseCase().execute({
        rawPayload: message.raw, // hex string or base64
        sourceIdentifier: message.source,
      });

      if (result.isFailure()) {
        logger.error({ error: result.error, message: message.raw }, 'Failed to process GSM message');
      } else {
        logger.debug({ messageId: result.value.id }, 'GSM message processed successfully');
      }
    } catch (error) {
      logger.error({ error, message: message.raw }, 'Unexpected error processing GSM message');
    }
  }
}

