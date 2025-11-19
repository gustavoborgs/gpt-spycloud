import { Router } from 'express';
import { DevicesController } from './devices.controller';
import { CreateDeviceSchema } from '../../application/dtos/CreateDeviceDTO';

const router = Router();
const controller = new DevicesController();

// Validation middleware
function validate(schema: any) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: result.error.errors,
      });
    }
    req.body = result.data;
    next();
  };
}

router.post('/', validate(CreateDeviceSchema), (req, res, next) => {
  controller.create(req, res).catch(next);
});

router.get('/', (req, res, next) => {
  controller.list(req, res).catch(next);
});

router.post('/:id/bind', (req, res, next) => {
  controller.bindToAsset(req, res).catch(next);
});

export { router as devicesRoutes };

