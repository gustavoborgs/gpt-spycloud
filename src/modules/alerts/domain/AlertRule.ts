import { Entity } from '../../../core/domain/Entity';
import { EventType } from '../../events/domain/EventType';

export interface AlertRuleProps {
  tenantId: string;
  name: string;
  eventType: EventType;
  enabled: boolean;
  conditions?: Record<string, any>;
  notificationChannels: string[]; // webhook, email, etc.
  metadata?: Record<string, any>;
}

export class AlertRule extends Entity<AlertRuleProps> {
  private constructor(props: AlertRuleProps, id?: string, createdAt?: Date, updatedAt?: Date) {
    super(id || crypto.randomUUID(), createdAt, updatedAt);
    Object.assign(this, props);
  }

  static create(props: AlertRuleProps, id?: string, createdAt?: Date, updatedAt?: Date): AlertRule {
    return new AlertRule(props, id, createdAt, updatedAt);
  }

  get tenantId(): string {
    return (this as any).tenantId;
  }

  get name(): string {
    return (this as any).name;
  }

  get eventType(): EventType {
    return (this as any).eventType;
  }

  get enabled(): boolean {
    return (this as any).enabled;
  }

  get conditions(): Record<string, any> | undefined {
    return (this as any).conditions;
  }

  get notificationChannels(): string[] {
    return (this as any).notificationChannels;
  }

  get metadata(): Record<string, any> | undefined {
    return (this as any).metadata;
  }

  enable(): void {
    (this as any).enabled = true;
    this.touch();
  }

  disable(): void {
    (this as any).enabled = false;
    this.touch();
  }
}

