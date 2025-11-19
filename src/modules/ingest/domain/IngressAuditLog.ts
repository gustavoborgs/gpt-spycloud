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
  // Private fields for properties with getters
  private _processingStatus: ProcessingStatus;
  private _receivedAt: Date;
  private _processedAt?: Date;
  private _errorMessage?: string;
  private _errorStack?: string;

  private constructor(props: IngressAuditLogProps, id?: string, createdAt?: Date, updatedAt?: Date) {
    super(id || crypto.randomUUID(), createdAt, updatedAt);
    
    // Assign simple properties directly
    (this as any).rawPayload = props.rawPayload;
    (this as any).sourceType = props.sourceType;
    (this as any).sourceIdentifier = props.sourceIdentifier;
    (this as any).deviceSerialNumber = props.deviceSerialNumber;
    (this as any).remoteAddress = props.remoteAddress;
    (this as any).remotePort = props.remotePort;
    (this as any).userAgent = props.userAgent;
    (this as any).httpMethod = props.httpMethod;
    (this as any).httpPath = props.httpPath;
    (this as any).httpHeaders = props.httpHeaders;
    (this as any).metadata = props.metadata;
    
    // Assign properties with getters using private fields
    this._processingStatus = props.processingStatus || ProcessingStatus.RECEIVED;
    this._receivedAt = props.receivedAt || new Date();
    this._processedAt = props.processedAt;
    this._errorMessage = props.errorMessage;
    this._errorStack = props.errorStack;
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
    return this._processingStatus;
  }

  get errorMessage(): string | undefined {
    return this._errorMessage;
  }

  get errorStack(): string | undefined {
    return this._errorStack;
  }

  get metadata(): Record<string, any> | undefined {
    return (this as any).metadata;
  }

  get receivedAt(): Date {
    return this._receivedAt;
  }

  get processedAt(): Date | undefined {
    return this._processedAt;
  }

  markProcessing(): void {
    this._processingStatus = ProcessingStatus.PROCESSING;
    this.touch();
  }

  markSuccess(): void {
    this._processingStatus = ProcessingStatus.SUCCESS;
    this._processedAt = new Date();
    this.touch();
  }

  markFailed(error: Error | string): void {
    this._processingStatus = ProcessingStatus.FAILED;
    this._processedAt = new Date();
    
    if (error instanceof Error) {
      this._errorMessage = error.message;
      this._errorStack = error.stack;
    } else {
      this._errorMessage = error;
    }
    
    this.touch();
  }

  updateMetadata(metadata: Record<string, any>): void {
    (this as any).metadata = { ...(this as any).metadata, ...metadata };
    this.touch();
  }
}

