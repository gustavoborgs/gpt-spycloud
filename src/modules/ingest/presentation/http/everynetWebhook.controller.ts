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

    // Save audit log immediately - CRITICAL: must save before processing
    const auditRepo = this.getAuditLogRepository();
    const savedLog = await auditRepo.save(auditLog);
    if (!savedLog) {
      logger.error({ logId: auditLog.id }, 'CRITICAL: Failed to save initial audit log - data may be lost');
    } else {
      logger.debug({ logId: auditLog.id }, 'Initial audit log saved successfully');
    }

    try {
      // Mark as processing
      auditLog.markProcessing();
      auditRepo.saveOrUpdate(auditLog).catch((err) => {
        logger.error({ error: err, logId: auditLog.id }, 'Failed to update audit log to PROCESSING');
      });

      // Now process the message
      const result = await this.getHandleLoraMessageUseCase().execute({
        payload: req.body,
        sourceType: SourceType.LORAWAN_EVERYNET,
      });

      // Update audit log with success
      auditLog.markSuccess();
      await auditRepo.saveOrUpdate(auditLog).catch((err) => {
        logger.error({ error: err, logId: auditLog.id }, 'Failed to update audit log to SUCCESS');
      });

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
      // Update audit log with error - CRITICAL: must save this
      auditLog.markFailed(error);
      await auditRepo.saveOrUpdate(auditLog).catch((err) => {
        logger.error({ error: err, logId: auditLog.id }, 'CRITICAL: Failed to save failed audit log');
      });

      logger.error({ error, request: req.body, logId: auditLog.id }, 'Unexpected error in Everynet webhook');

      res.status(500).json({
        success: false,
        error: 'Internal server error',
      });
    }
  }
}

