import { Entity } from '../../../core/domain/Entity';
import { SourceType } from './SourceType';

export enum ProcessingStatus {
  RECEIVED = 'RECEIVED',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

export interface IngressAuditLogProps {
  rawPayload: string;
  sourceType: SourceType;
  sourceIdentifier?: string;
  deviceSerialNumber?: string;
  
  // Connection/Request metadata
  remoteAddress?: string;
  remotePort?: number;
  userAgent?: string;
  httpMethod?: string;
  httpPath?: string;
  httpHeaders?: Record<string, string>;
  
  // Processing status
  processingStatus?: ProcessingStatus;
  errorMessage?: string;
  errorStack?: string;
  
  // Additional metadata
  metadata?: Record<string, any>;
  
  // Timestamps
  receivedAt?: Date;
  processedAt?: Date;
}

export class IngressAuditLog extends Entity<IngressAuditLogProps> {
  private constructor(props: IngressAuditLogProps, id?: string, createdAt?: Date, updatedAt?: Date) {
    super(id || crypto.randomUUID(), createdAt, updatedAt);
    Object.assign(this, props);
  }

  static create(props: IngressAuditLogProps, id?: string, createdAt?: Date, updatedAt?: Date): IngressAuditLog {
    return new IngressAuditLog(
      {
        processingStatus: ProcessingStatus.RECEIVED,
        receivedAt: new Date(),
        ...props,
      },
      id,
      createdAt,
      updatedAt
    );
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

  get remoteAddress(): string | undefined {
    return (this as any).remoteAddress;
  }

  get remotePort(): number | undefined {
    return (this as any).remotePort;
  }

  get userAgent(): string | undefined {
    return (this as any).userAgent;
  }

  get httpMethod(): string | undefined {
    return (this as any).httpMethod;
  }

  get httpPath(): string | undefined {
    return (this as any).httpPath;
  }

  get httpHeaders(): Record<string, string> | undefined {
    return (this as any).httpHeaders;
  }

  get processingStatus(): ProcessingStatus {
    return (this as any).processingStatus || ProcessingStatus.RECEIVED;
  }

  get errorMessage(): string | undefined {
    return (this as any).errorMessage;
  }

  get errorStack(): string | undefined {
    return (this as any).errorStack;
  }

  get metadata(): Record<string, any> | undefined {
    return (this as any).metadata;
  }

  get receivedAt(): Date {
    return (this as any).receivedAt || this.createdAt;
  }

  get processedAt(): Date | undefined {
    return (this as any).processedAt;
  }

  markProcessing(): void {
    (this as any).processingStatus = ProcessingStatus.PROCESSING;
    this.touch();
  }

  markSuccess(): void {
    (this as any).processingStatus = ProcessingStatus.SUCCESS;
    (this as any).processedAt = new Date();
    this.touch();
  }

  markFailed(error: Error | string): void {
    (this as any).processingStatus = ProcessingStatus.FAILED;
    (this as any).processedAt = new Date();
    
    if (error instanceof Error) {
      (this as any).errorMessage = error.message;
      (this as any).errorStack = error.stack;
    } else {
      (this as any).errorMessage = error;
    }
    
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    (this as any).metadata = { ...(this as any).metadata, ...metadata };
    this.touch();
  }
}

