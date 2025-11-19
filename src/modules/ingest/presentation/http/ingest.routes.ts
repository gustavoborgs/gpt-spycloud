import { Router } from 'express';
import { EverynetWebhookController } from './everynetWebhook.controller';

const router = Router();
const everynetController = new EverynetWebhookController();

// Everynet webhook endpoint
router.post('/webhooks/everynet', (req, res, next) => {
  everynetController.handleWebhook(req, res).catch(next);
});

export { router as ingestRoutes };

