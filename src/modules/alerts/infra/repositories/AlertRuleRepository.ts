import { PrismaClient } from '@prisma/client';
import { AlertRule } from '../../domain/AlertRule';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { EventType } from '../../events/domain/EventType';
import { AlertRuleMapper } from '../mappers/AlertRuleMapper';

export class AlertRuleRepository extends BaseRepository<AlertRule> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findByEventType(eventType: EventType): Promise<AlertRule[]> {
    const prismaRules = await this.prisma.alertRule.findMany({
      where: {
        eventType,
        enabled: true,
      },
    });

    return prismaRules.map(AlertRuleMapper.toDomain);
  }

  async save(rule: AlertRule): Promise<AlertRule> {
    const prismaData = AlertRuleMapper.toPersistence(rule);
    const prismaRule = await this.prisma.alertRule.upsert({
      where: { id: rule.id },
      create: prismaData,
      update: prismaData,
    });
    return AlertRuleMapper.toDomain(prismaRule);
  }
}

