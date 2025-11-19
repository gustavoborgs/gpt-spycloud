import { PrismaClient, Device as PrismaDevice } from '@prisma/client';
import { Device } from '../../domain/Device';
import { DeviceStatus } from '../../domain/enums';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { PaginationDTO } from '../../../../core/application/dto';
import { normalizePagination } from '../../../../shared/utils/pagination';
import { DeviceMapper } from '../mappers/DeviceMapper';

export interface DeviceFilters {
  tenantId?: string;
  assetId?: string;
  status?: DeviceStatus;
}

export class DeviceRepository extends BaseRepository<Device> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<Device | null> {
    const prismaDevice = await this.prisma.device.findUnique({
      where: { id },
    });

    return prismaDevice ? DeviceMapper.toDomain(prismaDevice) : null;
  }

  async findBySerialNumber(serialNumber: string): Promise<Device | null> {
    const prismaDevice = await this.prisma.device.findFirst({
      where: { serialNumber },
    });

    return prismaDevice ? DeviceMapper.toDomain(prismaDevice) : null;
  }

  async findMany(filters: DeviceFilters & PaginationDTO): Promise<{ data: Device[]; total: number }> {
    const { page, limit, skip } = normalizePagination(filters);

    const where: any = {};
    if (filters.tenantId) where.tenantId = filters.tenantId;
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.status) where.status = filters.status;

    const [prismaDevices, total] = await Promise.all([
      this.prisma.device.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.device.count({ where }),
    ]);

    return {
      data: prismaDevices.map(DeviceMapper.toDomain),
      total,
    };
  }

  async save(device: Device): Promise<Device> {
    const prismaData = DeviceMapper.toPersistence(device);

    const prismaDevice = await this.prisma.device.upsert({
      where: { id: device.id },
      create: prismaData,
      update: prismaData,
    });

    return DeviceMapper.toDomain(prismaDevice);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.device.delete({
      where: { id },
    });
  }
}

