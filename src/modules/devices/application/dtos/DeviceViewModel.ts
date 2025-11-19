import { Device } from '../../domain/Device';

export interface DeviceViewModel {
  id: string;
  serialNumber: string;
  modelId: string;
  tenantId: string;
  assetId?: string;
  status: string;
  type: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export function toDeviceViewModel(device: Device): DeviceViewModel {
  return {
    id: device.id,
    serialNumber: device.serialNumber,
    modelId: device.modelId,
    tenantId: device.tenantId,
    assetId: device.assetId,
    status: device.status,
    type: device.type,
    metadata: device.metadata,
    createdAt: device.createdAt,
    updatedAt: device.updatedAt,
  };
}

