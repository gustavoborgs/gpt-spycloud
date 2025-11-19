import { PrismaClient } from '@prisma/client';
import { DecodedTelemetry } from '../../domain/DecodedTelemetry';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { normalizePagination } from '../../../../shared/utils/pagination';

export interface TelemetryFilters {
  deviceSerialNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

export class TelemetryRepository extends BaseRepository<any> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async save(telemetry: DecodedTelemetry): Promise<void> {
    // Find device by serial number to get deviceId
    const device = await this.prisma.device.findUnique({
      where: { serialNumber: telemetry.deviceSerialNumber },
    });

    if (!device) {
      throw new Error(`Device not found: ${telemetry.deviceSerialNumber}`);
    }

    await this.prisma.telemetryPoint.create({
      data: {
        deviceId: device.id,
        deviceSerialNumber: telemetry.deviceSerialNumber,
        timestamp: telemetry.timestamp,
        latitude: telemetry.latitude,
        longitude: telemetry.longitude,
        speed: telemetry.speed,
        heading: telemetry.heading,
        altitude: telemetry.altitude,
        ignition: telemetry.ignition,
        fuelLevel: telemetry.fuelLevel,
        additionalData: telemetry.additionalData || {},
      },
    });
  }

  async getLastPosition(deviceSerialNumber: string): Promise<DecodedTelemetry | null> {
    const point = await this.prisma.telemetryPoint.findFirst({
      where: { deviceSerialNumber },
      orderBy: { timestamp: 'desc' },
    });

    if (!point) return null;

    return {
      deviceSerialNumber: point.deviceSerialNumber,
      timestamp: point.timestamp,
      latitude: point.latitude,
      longitude: point.longitude,
      speed: point.speed,
      heading: point.heading,
      altitude: point.altitude,
      ignition: point.ignition || false,
      fuelLevel: point.fuelLevel,
      additionalData: point.additionalData as Record<string, any> | undefined,
    };
  }

  async query(filters: TelemetryFilters & { page?: number; limit?: number }): Promise<{
    data: DecodedTelemetry[];
    total: number;
  }> {
    const { page, limit, skip } = normalizePagination(filters);

    const where: any = {};
    if (filters.deviceSerialNumber) where.deviceSerialNumber = filters.deviceSerialNumber;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    const [points, total] = await Promise.all([
      this.prisma.telemetryPoint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.telemetryPoint.count({ where }),
    ]);

    return {
      data: points.map((point) => ({
        deviceSerialNumber: point.deviceSerialNumber,
        timestamp: point.timestamp,
        latitude: point.latitude,
        longitude: point.longitude,
        speed: point.speed,
        heading: point.heading,
        altitude: point.altitude,
        ignition: point.ignition || false,
        fuelLevel: point.fuelLevel,
        additionalData: point.additionalData as Record<string, any> | undefined,
      })),
      total,
    };
  }
}

