import { Router } from 'express';
import { DevicesController } from './devices.controller';
import { CreateDeviceSchema } from '../../application/dtos/CreateDeviceDTO';

const router = Router();

// Lazy initialization - controller is created when first route is accessed
let controllerInstance: DevicesController | null = null;

function getController(): DevicesController {
  if (!controllerInstance) {
    controllerInstance = new DevicesController();
  }
  return controllerInstance;
}

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
  getController().create(req, res).catch(next);
});

router.get('/', (req, res, next) => {
  getController().list(req, res).catch(next);
});

router.post('/:id/bind', (req, res, next) => {
  getController().bindToAsset(req, res).catch(next);
});

export { router as devicesRoutes };

