import { Entity } from '../../../core/domain/Entity';
import { DeviceStatus, DeviceType } from './enums';

export interface DeviceProps {
  serialNumber: string;
  modelId: string;
  tenantId: string;
  assetId?: string;
  status: DeviceStatus;
  type: DeviceType;
  metadata?: Record<string, any>;
}

export class Device extends Entity<DeviceProps> {
  private constructor(props: DeviceProps, id?: string, createdAt?: Date, updatedAt?: Date) {
    super(id || crypto.randomUUID(), createdAt, updatedAt);
    Object.assign(this, props);
  }

  static create(props: DeviceProps, id?: string, createdAt?: Date, updatedAt?: Date): Device {
    return new Device(props, id, createdAt, updatedAt);
  }

  get serialNumber(): string {
    return (this as any).serialNumber;
  }

  get modelId(): string {
    return (this as any).modelId;
  }

  get tenantId(): string {
    return (this as any).tenantId;
  }

  get assetId(): string | undefined {
    return (this as any).assetId;
  }

  get status(): DeviceStatus {
    return (this as any).status;
  }

  get type(): DeviceType {
    return (this as any).type;
  }

  get metadata(): Record<string, any> | undefined {
    return (this as any).metadata;
  }

  bindToAsset(assetId: string): void {
    (this as any).assetId = assetId;
    this.touch();
  }

  unbindFromAsset(): void {
    (this as any).assetId = undefined;
    this.touch();
  }

  updateStatus(status: DeviceStatus): void {
    (this as any).status = status;
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    (this as any).metadata = { ...(this as any).metadata, ...metadata };
    this.touch();
  }
}

