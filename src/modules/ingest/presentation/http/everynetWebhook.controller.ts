import { Request, Response } from 'express';
import { HandleLoraRawMessageUseCase } from '../../application/use-cases/HandleLoraRawMessage.usecase';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { IngressAuditLogRepository } from '../../infra/repositories/IngressAuditLogRepository';
import { IngressAuditLog } from '../../domain/IngressAuditLog';
import { getDb } from '../../../../config/db';
import { SourceType } from '../../domain/SourceType';
import { logger } from '../../../../config/logger';

export class EverynetWebhookController {
  private handleLoraMessageUseCase: HandleLoraRawMessageUseCase | null = null;
  private auditLogRepository: IngressAuditLogRepository | null = null;

  private getHandleLoraMessageUseCase(): HandleLoraRawMessageUseCase {
    if (!this.handleLoraMessageUseCase) {
      const repository = new IngressMessageRawRepository(getDb());
      this.handleLoraMessageUseCase = new HandleLoraRawMessageUseCase(repository);
    }
    return this.handleLoraMessageUseCase;
  }

  private getAuditLogRepository(): IngressAuditLogRepository {
    if (!this.auditLogRepository) {
      this.auditLogRepository = new IngressAuditLogRepository(getDb());
    }
    return this.auditLogRepository;
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    // Extract all possible information from request
    const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const remoteAddress = req.ip || req.socket.remoteAddress || undefined;
    const remotePort = req.socket.remotePort || undefined;
    
    // Extract HTTP headers
    const httpHeaders: Record<string, string> = {};
    Object.keys(req.headers).forEach((key) => {
      const value = req.headers[key];
      if (value) {
        httpHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
      }
    });

    // Create audit log FIRST - before any processing
    const auditLog = IngressAuditLog.create({
      rawPayload,
      sourceType: SourceType.LORAWAN_EVERYNET,
      sourceIdentifier: req.body?.meta?.gateway || req.body?.gateway_id || undefined,
      deviceSerialNumber: req.body?.meta?.device || req.body?.params?.device || req.body?.dev_eui || undefined,
      remoteAddress,
      remotePort,
      userAgent: req.headers['user-agent'] || undefined,
      httpMethod: req.method,
      httpPath: req.path,
      httpHeaders,
      metadata: {
        originalBody: req.body,
        query: req.query,
        params: req.params,
      },
    });

    // Save audit log immediately (fire-and-forget, should not block)
    this.getAuditLogRepository().saveUnsafe(auditLog);

    try {
      // Now process the message
      const result = await this.getHandleLoraMessageUseCase().execute({
        payload: req.body,
        sourceType: SourceType.LORAWAN_EVERYNET,
      });

      // Update audit log with success
      auditLog.markSuccess();
      this.getAuditLogRepository().saveUnsafe(auditLog);

      if (result.isFailure()) {
        res.status(result.statusCode || 400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.status(200).json({
        success: true,
        messageId: result.value.id,
      });
    } catch (error: any) {
      // Update audit log with error
      auditLog.markFailed(error);
      this.getAuditLogRepository().saveUnsafe(auditLog);

      logger.error({ error, request: req.body }, 'Unexpected error in Everynet webhook');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

