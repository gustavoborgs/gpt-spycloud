import { AlertRule as PrismaAlertRule, Prisma } from '@prisma/client';
import { AlertRule, AlertRuleProps } from '../../domain/AlertRule';
import { EventType } from '../../../events/domain/EventType';

export class AlertRuleMapper {
  static toDomain(prismaRule: PrismaAlertRule): AlertRule {
    const props: AlertRuleProps = {
      tenantId: prismaRule.tenantId,
      name: prismaRule.name,
      eventType: prismaRule.eventType as EventType,
      enabled: prismaRule.enabled,
      conditions: prismaRule.conditions as Record<string, any> | undefined,
      notificationChannels: prismaRule.notificationChannels as string[],
      metadata: prismaRule.metadata as Record<string, any> | undefined,
    };

    return AlertRule.create(props, prismaRule.id, prismaRule.createdAt, prismaRule.updatedAt);
  }

  static toPersistence(rule: AlertRule): Omit<PrismaAlertRule, 'id' | 'createdAt' | 'updatedAt' | 'metadata' | 'conditions'> & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: Prisma.InputJsonValue | null;
    conditions: Prisma.InputJsonValue | null;
  } {
    return {
      id: rule.id,
      tenantId: rule.tenantId,
      name: rule.name,
      eventType: rule.eventType,
      enabled: rule.enabled,
      conditions: rule.conditions ? (rule.conditions as Prisma.InputJsonValue) : null,
      notificationChannels: rule.notificationChannels,
      metadata: rule.metadata ? (rule.metadata as Prisma.InputJsonValue) : null,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}

