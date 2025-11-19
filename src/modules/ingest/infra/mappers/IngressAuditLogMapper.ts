import { Prisma } from '@prisma/client';
import { IngressAuditLog, IngressAuditLogProps, ProcessingStatus } from '../../domain/IngressAuditLog';
import { SourceType } from '../../domain/SourceType';

// Use Prisma's generated type - IngressAuditLog model from schema
type PrismaIngressAuditLog = {
  id: string;
  rawPayload: string;
  sourceType: string;
  sourceIdentifier: string | null;
  deviceSerialNumber: string | null;
  remoteAddress: string | null;
  remotePort: number | null;
  userAgent: string | null;
  httpMethod: string | null;
  httpPath: string | null;
  httpHeaders: Prisma.JsonValue | null;
  processingStatus: string;
  errorMessage: string | null;
  errorStack: string | null;
  metadata: Prisma.JsonValue | null;
  receivedAt: Date;
  processedAt: Date | null;
  createdAt: Date;
};

export class IngressAuditLogMapper {
  static toDomain(prismaLog: PrismaIngressAuditLog): IngressAuditLog {
    const props: IngressAuditLogProps = {
      rawPayload: prismaLog.rawPayload,
      sourceType: prismaLog.sourceType as SourceType,
      sourceIdentifier: prismaLog.sourceIdentifier || undefined,
      deviceSerialNumber: prismaLog.deviceSerialNumber || undefined,
      remoteAddress: prismaLog.remoteAddress || undefined,
      remotePort: prismaLog.remotePort || undefined,
      userAgent: prismaLog.userAgent || undefined,
      httpMethod: prismaLog.httpMethod || undefined,
      httpPath: prismaLog.httpPath || undefined,
      httpHeaders: prismaLog.httpHeaders as Record<string, string> | undefined,
      processingStatus: prismaLog.processingStatus as ProcessingStatus,
      errorMessage: prismaLog.errorMessage || undefined,
      errorStack: prismaLog.errorStack || undefined,
      metadata: prismaLog.metadata as Record<string, any> | undefined,
      receivedAt: prismaLog.receivedAt,
      processedAt: prismaLog.processedAt || undefined,
    };

    return IngressAuditLog.create(
      props,
      prismaLog.id,
      prismaLog.createdAt,
      prismaLog.createdAt // updatedAt not in schema, use createdAt
    );
  }

  static toPersistence(log: IngressAuditLog): Omit<PrismaIngressAuditLog, 'id' | 'createdAt' | 'httpHeaders' | 'metadata'> & {
    id: string;
    createdAt: Date;
  } {
    return {
      id: log.id,
      rawPayload: log.rawPayload,
      sourceType: log.sourceType,
      sourceIdentifier: log.sourceIdentifier || null,
      deviceSerialNumber: log.deviceSerialNumber || null,
      remoteAddress: log.remoteAddress || null,
      remotePort: log.remotePort || null,
      userAgent: log.userAgent || null,
      httpMethod: log.httpMethod || null,
      httpPath: log.httpPath || null,
      httpHeaders: log.httpHeaders ? (log.httpHeaders as Prisma.JsonValue) : null,
      processingStatus: log.processingStatus,
      errorMessage: log.errorMessage || null,
      errorStack: log.errorStack || null,
      metadata: log.metadata ? (log.metadata as Prisma.JsonValue) : null,
      receivedAt: log.receivedAt,
      processedAt: log.processedAt || null,
      createdAt: log.createdAt,
    } as any;
  }
}

