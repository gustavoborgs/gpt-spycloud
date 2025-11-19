import { Router } from 'express';
import { EverynetWebhookController } from './everynetWebhook.controller';

const router = Router();

// Lazy initialization - controller is created when first route is accessed
let everynetControllerInstance: EverynetWebhookController | null = null;

function getEverynetController(): EverynetWebhookController {
  if (!everynetControllerInstance) {
    everynetControllerInstance = new EverynetWebhookController();
  }
  return everynetControllerInstance;
}

// Everynet webhook endpoint
router.post('/webhooks/everynet', (req, res, next) => {
  getEverynetController().handleWebhook(req, res).catch(next);
});

export { router as ingestRoutes };

