import { PrismaClient } from '@prisma/client';
import { Event } from '../../domain/Event';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { EventMapper } from '../mappers/EventMapper';

export class EventRepository extends BaseRepository<Event> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async save(event: Event): Promise<Event> {
    // Find device by serial number to get deviceId
    const device = await this.prisma.device.findUnique({
      where: { serialNumber: event.deviceSerialNumber },
    });

    if (!device) {
      throw new Error(`Device not found: ${event.deviceSerialNumber}`);
    }

    const prismaData = EventMapper.toPersistence(event);
    prismaData.deviceId = device.id;

    const prismaEvent = await this.prisma.event.create({
      data: prismaData,
    });
    return EventMapper.toDomain(prismaEvent);
  }

  async getLastTelemetryState(deviceSerialNumber: string): Promise<{ ignition?: boolean } | null> {
    // This would typically query the last telemetry point
    // For now, return null - implement based on your needs
    return null;
  }
}

