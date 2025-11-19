import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { DeviceRepository } from '../../infra/repositories/DeviceRepository';
import { CreateDeviceDTO } from '../dtos/CreateDeviceDTO';
import { DeviceViewModel, toDeviceViewModel } from '../dtos/DeviceViewModel';
import { Device } from '../../domain/Device';
import { InvalidDeviceModelError } from '../../domain/errors';
import { DEVICE_MODEL_CAPABILITIES } from '../../../../shared/mapping/deviceModelCapabilities';

export class CreateDeviceUseCase implements UseCase<CreateDeviceDTO, DeviceViewModel> {
  constructor(private deviceRepository: DeviceRepository) {}

  async execute(request: CreateDeviceDTO): Promise<Result<DeviceViewModel>> {
    try {
      // Validate model exists
      if (!DEVICE_MODEL_CAPABILITIES[request.modelId]) {
        return fail(new InvalidDeviceModelError(request.modelId).message, 400);
      }

      // Check if serial number already exists
      const existing = await this.deviceRepository.findBySerialNumber(request.serialNumber);
      if (existing) {
        return fail('Device with this serial number already exists', 409);
      }

      // Create device
      const device = Device.create({
        serialNumber: request.serialNumber,
        modelId: request.modelId,
        tenantId: request.tenantId,
        assetId: request.assetId,
        status: request.status,
        type: request.type,
        metadata: request.metadata,
      });

      // Save
      const saved = await this.deviceRepository.save(device);

      return ok(toDeviceViewModel(saved));
    } catch (error: any) {
      return fail(error.message || 'Failed to create device', 500);
    }
  }
}

