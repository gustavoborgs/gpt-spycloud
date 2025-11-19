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
  private sourceIdentifier: string = '';

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

  /**
   * Set the source identifier (IP:Port) for this handler instance
   * This should be called when a connection is established
   */
  setSourceIdentifier(source: string): void {
    this.sourceIdentifier = source;
  }

  async handleMessage(rawPayload: string): Promise<void> {
    let auditLog: IngressAuditLog | undefined;
    const auditRepo = this.getAuditLogRepository();

    try {
      // Validate source identifier
      if (!this.sourceIdentifier) {
        logger.error({ rawPayload }, 'Source identifier not set - cannot process message');
        throw new Error('Source identifier not set');
      }

      // Extract connection info from source identifier
      const [remoteAddress, remotePortStr] = this.sourceIdentifier.split(':');
      const remotePort = remotePortStr ? parseInt(remotePortStr, 10) : undefined;

      logger.debug({ 
        rawPayload: rawPayload.substring(0, 50) + '...', 
        sourceIdentifier: this.sourceIdentifier,
        payloadLength: rawPayload.length 
      }, 'Processing GSM message');

      // Create audit log FIRST - before any processing
      auditLog = IngressAuditLog.create({
        rawPayload,
        sourceType: SourceType.GSM_APN,
        sourceIdentifier: this.sourceIdentifier,
        remoteAddress,
        remotePort,
        metadata: {
          receivedAt: new Date().toISOString(),
          rawStringLength: rawPayload.length,
        },
      });

      // Save audit log immediately - CRITICAL: must save before processing
      const savedLog = await auditRepo.save(auditLog);
      if (!savedLog) {
        logger.error({ logId: auditLog.id, rawPayload: rawPayload.substring(0, 50) }, 'CRITICAL: Failed to save initial audit log - data may be lost');
        // Try to log the error details via direct Prisma
        try {
          const prisma = getDb();
          await prisma.ingressAuditLog.create({
            data: {
              id: auditLog.id,
              rawPayload,
              sourceType: SourceType.GSM_APN,
              sourceIdentifier: this.sourceIdentifier,
              remoteAddress,
              remotePort: remotePort || null,
              processingStatus: 'RECEIVED',
              receivedAt: new Date(),
              createdAt: new Date(),
            } as any,
          });
          logger.info({ logId: auditLog.id }, 'Audit log saved via direct Prisma call');
        } catch (directError: any) {
          logger.error({ 
            error: directError?.message || directError,
            stack: directError?.stack,
            logId: auditLog.id 
          }, 'CRITICAL: Even direct Prisma save failed');
        }
      } else {
        logger.debug({ logId: auditLog.id }, 'Initial audit log saved successfully');
      }

      // Mark as processing (auditLog is guaranteed to be defined here)
      if (auditLog) {
        auditLog.markProcessing();
        auditRepo.saveOrUpdate(auditLog).catch((err) => {
          logger.error({ error: err, logId: auditLog!.id }, 'Failed to update audit log to PROCESSING');
        });
      }

      // The raw payload is a base64 string that will be converted in the decoder
      const result = await this.getHandleGsmMessageUseCase().execute({
        rawPayload, // base64 string
        sourceIdentifier: this.sourceIdentifier,
      });

      if (result.isFailure()) {
        logger.error({ error: result.error, rawPayload }, 'Failed to process GSM message');
        if (auditLog) {
          auditLog.markFailed(result.error || 'Unknown error');
          await auditRepo.saveOrUpdate(auditLog).catch((err) => {
            logger.error({ error: err, logId: auditLog!.id }, 'Failed to update audit log to FAILED');
          });
        }
      } else {
        // Update audit log with success
        if (auditLog) {
          auditLog.markSuccess();
          await auditRepo.saveOrUpdate(auditLog).catch((err) => {
            logger.error({ error: err, logId: auditLog!.id }, 'Failed to update audit log to SUCCESS');
          });
        }
        logger.debug({ messageId: result.value.id }, 'GSM message processed successfully');
      }
    } catch (error: any) {
      // Update audit log with error - CRITICAL: must save this
      // Note: auditLog might not be defined if error happened before creation
      if (auditLog) {
        try {
          auditLog.markFailed(error);
          await auditRepo.saveOrUpdate(auditLog).catch((err) => {
            logger.error({ error: err, logId: auditLog!.id }, 'CRITICAL: Failed to save failed audit log');
          });
        } catch (updateError: any) {
          logger.error({ 
            error: updateError?.message || updateError,
            logId: auditLog!.id 
          }, 'Failed to mark audit log as failed');
        }
      }

      logger.error({ 
        error: error?.message || error,
        stack: error?.stack,
        rawPayload: rawPayload?.substring(0, 50),
        logId: auditLog?.id
      }, 'Unexpected error processing GSM message');
      
      // Re-throw to be caught by gsmServer
      throw error;
    }
  }
}

