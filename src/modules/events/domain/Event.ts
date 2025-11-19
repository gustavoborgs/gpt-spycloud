import { Entity } from '../../../core/domain/Entity';
import { EventType } from './EventType';

export interface EventProps {
  deviceSerialNumber: string;
  eventType: EventType;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, any>;
}

export class Event extends Entity<EventProps> {
  private constructor(props: EventProps, id?: string, createdAt?: Date, updatedAt?: Date) {
    super(id || crypto.randomUUID(), createdAt, updatedAt);
    Object.assign(this, props);
  }

  static create(props: EventProps, id?: string, createdAt?: Date, updatedAt?: Date): Event {
    return new Event(props, id, createdAt, updatedAt);
  }

  get deviceSerialNumber(): string {
    return (this as any).deviceSerialNumber;
  }

  get eventType(): EventType {
    return (this as any).eventType;
  }

  get timestamp(): Date {
    return (this as any).timestamp;
  }

  get latitude(): number | undefined {
    return (this as any).latitude;
  }

  get longitude(): number | undefined {
    return (this as any).longitude;
  }

  get metadata(): Record<string, any> | undefined {
    return (this as any).metadata;
  }
}

