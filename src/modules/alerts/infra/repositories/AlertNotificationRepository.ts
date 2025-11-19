import { PrismaClient } from '@prisma/client';
import { AlertNotification } from '../../domain/AlertNotification';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { AlertNotificationMapper } from '../mappers/AlertNotificationMapper';

export class AlertNotificationRepository extends BaseRepository<AlertNotification> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async save(notification: AlertNotification): Promise<AlertNotification> {
    const prismaData = AlertNotificationMapper.toPersistence(notification);
    const prismaNotification = await this.prisma.alertNotification.create({
      data: prismaData,
    });
    return AlertNotificationMapper.toDomain(prismaNotification);
  }
}

