import { AlertNotification as PrismaAlertNotification, Prisma } from '@prisma/client';
import { AlertNotification, AlertNotificationProps, NotificationStatus } from '../../domain/AlertNotification';

export class AlertNotificationMapper {
  static toDomain(prismaNotification: PrismaAlertNotification): AlertNotification {
    const props: AlertNotificationProps = {
      alertRuleId: prismaNotification.alertRuleId,
      deviceSerialNumber: prismaNotification.deviceSerialNumber,
      eventId: prismaNotification.eventId,
      status: prismaNotification.status as NotificationStatus,
      metadata: prismaNotification.metadata as Record<string, any> | undefined,
    };

    return AlertNotification.create(
      props,
      prismaNotification.id,
      prismaNotification.createdAt,
      prismaNotification.updatedAt
    );
  }

  static toPersistence(
    notification: AlertNotification
  ): Omit<PrismaAlertNotification, 'id' | 'createdAt' | 'updatedAt' | 'metadata'> & {
    metadata: Prisma.InputJsonValue | null;
  } {
    return {
      alertRuleId: notification.alertRuleId,
      deviceSerialNumber: notification.deviceSerialNumber,
      eventId: notification.eventId,
      status: notification.status,
      metadata: notification.metadata ? (notification.metadata as Prisma.InputJsonValue) : null,
    };
  }
}

