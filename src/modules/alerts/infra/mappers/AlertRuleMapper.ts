import { AlertRule as PrismaAlertRule } from '@prisma/client';
import { AlertRule, AlertRuleProps } from '../../domain/AlertRule';
import { EventType } from '../../events/domain/EventType';

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

  static toPersistence(rule: AlertRule): Omit<PrismaAlertRule, 'id' | 'createdAt' | 'updatedAt'> & {
    id: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: rule.id,
      tenantId: rule.tenantId,
      name: rule.name,
      eventType: rule.eventType,
      enabled: rule.enabled,
      conditions: rule.conditions || null,
      notificationChannels: rule.notificationChannels,
      metadata: rule.metadata || null,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
    };
  }
}

