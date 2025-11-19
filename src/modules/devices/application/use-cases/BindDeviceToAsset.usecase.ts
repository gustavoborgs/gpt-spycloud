import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { DeviceRepository } from '../../infra/repositories/DeviceRepository';
import { DeviceViewModel, toDeviceViewModel } from '../dtos/DeviceViewModel';
import { DeviceAlreadyBoundError, DeviceNotFoundError } from '../../domain/errors';

export interface BindDeviceToAssetRequest {
  deviceId: string;
  assetId: string;
}

export class BindDeviceToAssetUseCase implements UseCase<BindDeviceToAssetRequest, DeviceViewModel> {
  constructor(private deviceRepository: DeviceRepository) {}

  async execute(request: BindDeviceToAssetRequest): Promise<Result<DeviceViewModel>> {
    try {
      const device = await this.deviceRepository.findById(request.deviceId);

      if (!device) {
        return fail(new DeviceNotFoundError(request.deviceId).message, 404);
      }

      if (device.assetId && device.assetId !== request.assetId) {
        return fail(new DeviceAlreadyBoundError(device.serialNumber).message, 409);
      }

      device.bindToAsset(request.assetId);
      const saved = await this.deviceRepository.save(device);

      return ok(toDeviceViewModel(saved));
    } catch (error: any) {
      return fail(error.message || 'Failed to bind device to asset', 500);
    }
  }
}

