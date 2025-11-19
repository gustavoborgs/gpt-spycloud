import { Event as PrismaEvent, Prisma } from '@prisma/client';
import { Event, EventProps } from '../../domain/Event';
import { EventType } from '../../domain/EventType';

export class EventMapper {
  static toDomain(prismaEvent: PrismaEvent): Event {
    const props: EventProps = {
      deviceSerialNumber: prismaEvent.deviceSerialNumber,
      eventType: prismaEvent.eventType as EventType,
      timestamp: prismaEvent.timestamp,
      latitude: prismaEvent.latitude || undefined,
      longitude: prismaEvent.longitude || undefined,
      metadata: prismaEvent.metadata as Record<string, any> | undefined,
    };

    return Event.create(props, prismaEvent.id, prismaEvent.createdAt, prismaEvent.updatedAt);
  }

  static toPersistence(event: Event): Omit<PrismaEvent, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> & {
    deviceId: string;
    metadata: Prisma.InputJsonValue | null;
  } {
    // Note: deviceId needs to be resolved from deviceSerialNumber before calling this
    // This is a simplified version - in practice, you'd pass deviceId separately
    return {
      deviceId: '', // Must be set by repository
      deviceSerialNumber: event.deviceSerialNumber,
      eventType: event.eventType,
      timestamp: event.timestamp,
      latitude: event.latitude || null,
      longitude: event.longitude || null,
      metadata: event.metadata ? (event.metadata as Prisma.InputJsonValue) : null,
    };
  }
}

