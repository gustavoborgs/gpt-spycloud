import { PrismaClient } from '@prisma/client';
import { AlertNotification } from '../../domain/AlertNotification';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { AlertNotificationMapper } from '../mappers/AlertNotificationMapper';

export class AlertNotificationRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async save(notification: AlertNotification): Promise<AlertNotification> {
    const prismaData = AlertNotificationMapper.toPersistence(notification);
    const prismaNotification = await this.prisma.alertNotification.create({
      data: prismaData as any,
    });
    return AlertNotificationMapper.toDomain(prismaNotification);
  }
}

