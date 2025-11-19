import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { DecodedTelemetry } from '../../telemetry/domain/DecodedTelemetry';
import { EventRepository } from '../../infra/repositories/EventRepository';
import { Event } from '../../domain/Event';
import { EventType } from '../../domain/EventType';
import { logger } from '../../../../config/logger';

export class GenerateEventsFromTelemetryUseCase
  implements UseCase<DecodedTelemetry, Event[]>
{
  constructor(private eventRepository: EventRepository) {}

  async execute(telemetry: DecodedTelemetry): Promise<Result<Event[]>> {
    try {
      const events: Event[] = [];

      // Check for ignition events
      if (telemetry.ignition !== undefined) {
        const lastTelemetry = await this.eventRepository.getLastTelemetryState(
          telemetry.deviceSerialNumber
        );

        if (lastTelemetry?.ignition !== telemetry.ignition) {
          events.push(
            Event.create({
              deviceSerialNumber: telemetry.deviceSerialNumber,
              eventType: telemetry.ignition ? EventType.IGNITION_ON : EventType.IGNITION_OFF,
              timestamp: telemetry.timestamp,
              latitude: telemetry.latitude,
              longitude: telemetry.longitude,
            })
          );
        }
      }

      // Check for speed alert (example: > 120 km/h)
      if (telemetry.speed > 120) {
        events.push(
          Event.create({
            deviceSerialNumber: telemetry.deviceSerialNumber,
            eventType: EventType.SPEED_ALERT,
            timestamp: telemetry.timestamp,
            latitude: telemetry.latitude,
            longitude: telemetry.longitude,
            metadata: { speed: telemetry.speed },
          })
        );
      }

      // Save events
      for (const event of events) {
        await this.eventRepository.save(event);
      }

      logger.debug(
        { deviceSerialNumber: telemetry.deviceSerialNumber, eventCount: events.length },
        'Events generated from telemetry'
      );

      return ok(events);
    } catch (error: any) {
      logger.error({ error }, 'Failed to generate events from telemetry');
      return fail(error.message || 'Failed to generate events', 500);
    }
  }
}

