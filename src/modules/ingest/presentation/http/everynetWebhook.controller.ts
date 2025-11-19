import { Request, Response } from 'express';
import { HandleLoraRawMessageUseCase } from '../../application/use-cases/HandleLoraRawMessage.usecase';
import { IngressMessageRawRepository } from '../../infra/repositories/IngressMessageRawRepository';
import { getDb } from '../../../../config/db';
import { SourceType } from '../../domain/SourceType';

export class EverynetWebhookController {
  private handleLoraMessageUseCase: HandleLoraRawMessageUseCase;

  constructor() {
    const repository = new IngressMessageRawRepository(getDb());
    this.handleLoraMessageUseCase = new HandleLoraRawMessageUseCase(repository);
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    const result = await this.handleLoraMessageUseCase.execute({
      payload: req.body,
      sourceType: SourceType.LORAWAN_EVERYNET,
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
  }
}

