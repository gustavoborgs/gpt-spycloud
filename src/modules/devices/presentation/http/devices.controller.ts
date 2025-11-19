import { Request, Response } from 'express';
import { CreateDeviceUseCase } from '../../application/use-cases/CreateDevice.usecase';
import { ListDevicesUseCase, ListDevicesRequest } from '../../application/use-cases/ListDevices.usecase';
import { BindDeviceToAssetUseCase } from '../../application/use-cases/BindDeviceToAsset.usecase';
import { DeviceRepository } from '../../infra/repositories/DeviceRepository';
import { getDb } from '../../../../config/db';

export class DevicesController {
  private createDeviceUseCase: CreateDeviceUseCase;
  private listDevicesUseCase: ListDevicesUseCase;
  private bindDeviceToAssetUseCase: BindDeviceToAssetUseCase;

  constructor() {
    const deviceRepository = new DeviceRepository(getDb());
    this.createDeviceUseCase = new CreateDeviceUseCase(deviceRepository);
    this.listDevicesUseCase = new ListDevicesUseCase(deviceRepository);
    this.bindDeviceToAssetUseCase = new BindDeviceToAssetUseCase(deviceRepository);
  }

  async create(req: Request, res: Response): Promise<void> {
    const result = await this.createDeviceUseCase.execute(req.body);

    if (result.isFailure()) {
      res.status(result.statusCode || 400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      data: result.value,
    });
  }

  async list(req: Request, res: Response): Promise<void> {
    const request: ListDevicesRequest = {
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      tenantId: req.query.tenantId as string,
      assetId: req.query.assetId as string,
      status: req.query.status as string,
    };

    const result = await this.listDevicesUseCase.execute(request);

    if (result.isFailure()) {
      res.status(result.statusCode || 400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.value,
    });
  }

  async bindToAsset(req: Request, res: Response): Promise<void> {
    const result = await this.bindDeviceToAssetUseCase.execute({
      deviceId: req.params.id,
      assetId: req.body.assetId,
    });

    if (result.isFailure()) {
      res.status(result.statusCode || 400).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.json({
      success: true,
      data: result.value,
    });
  }
}

