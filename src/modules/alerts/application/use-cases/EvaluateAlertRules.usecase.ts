import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { Event } from '../../../events/domain/Event';
import { AlertRuleRepository } from '../../infra/repositories/AlertRuleRepository';
import { AlertNotificationRepository } from '../../infra/repositories/AlertNotificationRepository';
import { AlertNotification, NotificationStatus } from '../../domain/AlertNotification';
import { logger } from '../../../../config/logger';

export class EvaluateAlertRulesUseCase implements UseCase<Event, void> {
  constructor(
    private alertRuleRepository: AlertRuleRepository,
    private alertNotificationRepository: AlertNotificationRepository
  ) {}

  async execute(event: Event): Promise<Result<void>> {
    try {
      const rules = await this.alertRuleRepository.findByEventType(event.eventType);

      for (const rule of rules) {
        if (!rule.enabled) continue;

        // Check if rule applies to this device/tenant
        // This is simplified - you'd add more logic here

        const notification = AlertNotification.create({
          alertRuleId: rule.id,
          deviceSerialNumber: event.deviceSerialNumber,
          eventId: event.id,
          status: NotificationStatus.PENDING,
          metadata: {
            eventType: event.eventType,
            timestamp: event.timestamp,
          },
        });

        await this.alertNotificationRepository.save(notification);

        // Trigger notification (webhook, email, etc.)
        // This would be handled by a separate service/queue
        logger.info(
          { alertRuleId: rule.id, eventId: event.id },
          'Alert notification created'
        );
      }

      return ok(undefined);
    } catch (error: any) {
      logger.error({ error, eventId: event.id }, 'Failed to evaluate alert rules');
      return fail(error.message || 'Failed to evaluate alert rules', 500);
    }
  }
}

