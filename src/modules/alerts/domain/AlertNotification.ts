import { Entity } from '../../../core/domain/Entity';

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface AlertNotificationProps {
  alertRuleId: string;
  deviceSerialNumber: string;
  eventId: string;
  status: NotificationStatus;
  metadata?: Record<string, any>;
}

export class AlertNotification extends Entity<AlertNotificationProps> {
  private constructor(
    props: AlertNotificationProps,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    super(id || crypto.randomUUID(), createdAt, updatedAt);
    Object.assign(this, props);
  }

  static create(
    props: AlertNotificationProps,
    id?: string,
    createdAt?: Date,
    updatedAt?: Date
  ): AlertNotification {
    return new AlertNotification(props, id, createdAt, updatedAt);
  }

  get alertRuleId(): string {
    return (this as any).alertRuleId;
  }

  get deviceSerialNumber(): string {
    return (this as any).deviceSerialNumber;
  }

  get eventId(): string {
    return (this as any).eventId;
  }

  get status(): NotificationStatus {
    return (this as any).status;
  }

  get metadata(): Record<string, any> | undefined {
    return (this as any).metadata;
  }

  markAsSent(): void {
    (this as any).status = NotificationStatus.SENT;
    this.touch();
  }

  markAsFailed(): void {
    (this as any).status = NotificationStatus.FAILED;
    this.touch();
  }
}

