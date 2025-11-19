import { Device as PrismaDevice } from '@prisma/client';
import { Device, DeviceProps } from '../../domain/Device';
import { DeviceStatus, DeviceType } from '../../domain/enums';

export class DeviceMapper {
  static toDomain(prismaDevice: PrismaDevice): Device {
    const props: DeviceProps = {
      serialNumber: prismaDevice.serialNumber,
      modelId: prismaDevice.modelId,
      tenantId: prismaDevice.tenantId,
      assetId: prismaDevice.assetId || undefined,
      status: prismaDevice.status as DeviceStatus,
      type: prismaDevice.type as DeviceType,
      metadata: prismaDevice.metadata as Record<string, any> | undefined,
    };

    return Device.create(props, prismaDevice.id, prismaDevice.createdAt, prismaDevice.updatedAt);
  }

  static toPersistence(device: Device): Omit<PrismaDevice, 'id' | 'createdAt' | 'updatedAt'> & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: device.id,
      serialNumber: device.serialNumber,
      modelId: device.modelId,
      tenantId: device.tenantId,
      assetId: device.assetId || null,
      status: device.status,
      type: device.type,
      metadata: device.metadata || null,
      createdAt: device.createdAt,
      updatedAt: device.updatedAt,
    };
  }
}

