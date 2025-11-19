import { GsmMessage } from '../../../../infra/tcp/gsmServer';
import { HandleGsmRawMessageUseCase } from '../../application/use-cases/HandleGsmRawMessage.usecase';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { IngressAuditLogRepository } from '../../infra/repositories/IngressAuditLogRepository';
import { IngressAuditLog } from '../../domain/IngressAuditLog';
import { getDb } from '../../../../config/db';
import { logger } from '../../../../config/logger';
import { SourceType } from '../../domain/SourceType';

export class GsmSocketHandler {
  private handleGsmMessageUseCase: HandleGsmRawMessageUseCase | null = null;
  private auditLogRepository: IngressAuditLogRepository | null = null;

  private getHandleGsmMessageUseCase(): HandleGsmRawMessageUseCase {
    if (!this.handleGsmMessageUseCase) {
      const repository = new IngressMessageRawRepository(getDb());
      this.handleGsmMessageUseCase = new HandleGsmRawMessageUseCase(repository);
    }
    return this.handleGsmMessageUseCase;
  }

  private getAuditLogRepository(): IngressAuditLogRepository {
    if (!this.auditLogRepository) {
      this.auditLogRepository = new IngressAuditLogRepository(getDb());
    }
    return this.auditLogRepository;
  }

  async handleMessage(message: GsmMessage): Promise<void> {
    // Extract connection info
    const [remoteAddress, remotePortStr] = message.source.split(':');
    const remotePort = remotePortStr ? parseInt(remotePortStr, 10) : undefined;

    // Create audit log FIRST - before any processing
    const auditLog = IngressAuditLog.create({
      rawPayload: message.raw,
      sourceType: SourceType.GSM_APN,
      sourceIdentifier: message.source,
      remoteAddress,
      remotePort,
      metadata: {
        rawBuffer: message.rawBuffer ? message.rawBuffer.toString('hex') : undefined,
        bufferLength: message.rawBuffer?.length,
        receivedAt: message.receivedAt.toISOString(),
      },
    });

    // Save audit log immediately (fire-and-forget, should not block)
    this.getAuditLogRepository().saveUnsafe(auditLog);

    try {
      // The raw payload can be hex or base64
      // The decoder will detect the format automatically
      const result = await this.getHandleGsmMessageUseCase().execute({
        rawPayload: message.raw, // hex string or base64
        sourceIdentifier: message.source,
      });

      // Update audit log with success
      auditLog.markSuccess();
      this.getAuditLogRepository().saveUnsafe(auditLog);

      if (result.isFailure()) {
        logger.error({ error: result.error, message: message.raw }, 'Failed to process GSM message');
        auditLog.markFailed(result.error || 'Unknown error');
        this.getAuditLogRepository().saveUnsafe(auditLog);
      } else {
        logger.debug({ messageId: result.value.id }, 'GSM message processed successfully');
      }
    } catch (error: any) {
      // Update audit log with error
      auditLog.markFailed(error);
      this.getAuditLogRepository().saveUnsafe(auditLog);

      logger.error({ error, message: message.raw }, 'Unexpected error processing GSM message');
    }
  }
}

