import { PrismaClient } from '@prisma/client';
import { IngressAuditLog } from '../../domain/IngressAuditLog';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { IngressAuditLogMapper } from '../mappers/IngressAuditLogMapper';

export class IngressAuditLogRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Save audit log - this should NEVER fail, it's the backup/audit system
   * Uses a try-catch to ensure it doesn't throw even if there's an issue
   */
  async save(log: IngressAuditLog): Promise<IngressAuditLog | null> {
    try {
      const prismaData = IngressAuditLogMapper.toPersistence(log);

      const prismaLog = await this.prisma.ingressAuditLog.create({
        data: prismaData as any,
      });

      return IngressAuditLogMapper.toDomain(prismaLog);
    } catch (error: any) {
      // Log error but don't throw - audit log should not break the main flow
      console.error('Failed to save audit log:', error);
      return null;
    }
  }

  /**
   * Save audit log synchronously with minimal error handling
   * This is a fire-and-forget operation
   */
  async saveUnsafe(log: IngressAuditLog): Promise<void> {
    // Use setImmediate to not block the main flow
    setImmediate(async () => {
      try {
        const prismaData = IngressAuditLogMapper.toPersistence(log);
        await this.prisma.ingressAuditLog.create({
          data: prismaData as any,
        });
      } catch (error) {
        // Silently fail - audit log should not break main flow
        console.error('Failed to save audit log (async):', error);
      }
    });
  }

  async findById(id: string): Promise<IngressAuditLog | null> {
    const prismaLog = await this.prisma.ingressAuditLog.findUnique({
      where: { id },
    });

    return prismaLog ? IngressAuditLogMapper.toDomain(prismaLog) : null;
  }

  async findByDeviceSerialNumber(
    deviceSerialNumber: string,
    limit: number = 100
  ): Promise<IngressAuditLog[]> {
    const prismaLogs = await this.prisma.ingressAuditLog.findMany({
      where: { deviceSerialNumber },
      take: limit,
      orderBy: { receivedAt: 'desc' },
    });

    return prismaLogs.map(IngressAuditLogMapper.toDomain);
  }

  async findBySourceType(
    sourceType: string,
    limit: number = 100
  ): Promise<IngressAuditLog[]> {
    const prismaLogs = await this.prisma.ingressAuditLog.findMany({
      where: { sourceType },
      take: limit,
      orderBy: { receivedAt: 'desc' },
    });

    return prismaLogs.map(IngressAuditLogMapper.toDomain);
  }

  async findFailed(limit: number = 100): Promise<IngressAuditLog[]> {
    const prismaLogs = await this.prisma.ingressAuditLog.findMany({
      where: { processingStatus: 'FAILED' },
      take: limit,
      orderBy: { receivedAt: 'desc' },
    });

    return prismaLogs.map(IngressAuditLogMapper.toDomain);
  }
}

