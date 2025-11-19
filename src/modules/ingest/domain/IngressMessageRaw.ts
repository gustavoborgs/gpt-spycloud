import { Entity } from '../../../core/domain/Entity';
import { SourceType } from './SourceType';

export interface IngressMessageRawProps {
  rawPayload: string;
  sourceType: SourceType;
  sourceIdentifier?: string;
  deviceSerialNumber?: string;
  metadata?: Record<string, any>;
}

export class IngressMessageRaw extends Entity<IngressMessageRawProps> {
  private constructor(props: IngressMessageRawProps, id?: string, createdAt?: Date, updatedAt?: Date) {
    super(id || crypto.randomUUID(), createdAt, updatedAt);
    Object.assign(this, props);
  }

  static create(props: IngressMessageRawProps, id?: string, createdAt?: Date, updatedAt?: Date): IngressMessageRaw {
    return new IngressMessageRaw(props, id, createdAt, updatedAt);
  }

  get rawPayload(): string {
    return (this as any).rawPayload;
  }

  get sourceType(): SourceType {
    return (this as any).sourceType;
  }

  get sourceIdentifier(): string | undefined {
    return (this as any).sourceIdentifier;
  }

  get deviceSerialNumber(): string | undefined {
    return (this as any).deviceSerialNumber;
  }

  get metadata(): Record<string, any> | undefined {
    return (this as any).metadata;
  }

  updateMetadata(metadata: Record<string, any>): void {
    (this as any).metadata = { ...(this as any).metadata, ...metadata };
    this.touch();
  }
}

