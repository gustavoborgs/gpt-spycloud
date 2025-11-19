import { PrismaClient } from '@prisma/client';
import { IngressAuditLog } from '../../domain/IngressAuditLog';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { IngressAuditLogMapper } from '../mappers/IngressAuditLogMapper';
import { logger } from '../../../../config/logger';

export class IngressAuditLogRepository extends BaseRepository {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  /**
   * Save audit log - this should NEVER fail, it's the backup/audit system
   * Uses a try-catch to ensure it doesn't throw even if there's an issue
   * This method awaits the save to ensure it completes
   */
  async save(log: IngressAuditLog): Promise<IngressAuditLog | null> {
    try {
      const prismaData = IngressAuditLogMapper.toPersistence(log);

      const prismaLog = await this.prisma.ingressAuditLog.create({
        data: prismaData as any,
      });

      logger.debug({ auditLogId: prismaLog.id }, 'Audit log saved successfully');
      return IngressAuditLogMapper.toDomain(prismaLog);
    } catch (error: any) {
      // Log error but don't throw - audit log should not break the main flow
      logger.error({ error: error.message, stack: error.stack, logId: log.id }, 'Failed to save audit log');
      return null;
    }
  }

  /**
   * Save or update audit log using upsert
   * This ensures the log is saved even if it already exists
   */
  async saveOrUpdate(log: IngressAuditLog): Promise<IngressAuditLog | null> {
    try {
      const prismaData = IngressAuditLogMapper.toPersistence(log);

      const prismaLog = await this.prisma.ingressAuditLog.upsert({
        where: { id: log.id },
        create: prismaData as any,
        update: prismaData as any,
      });

      logger.debug({ auditLogId: prismaLog.id, status: prismaLog.processingStatus }, 'Audit log saved/updated successfully');
      return IngressAuditLogMapper.toDomain(prismaLog);
    } catch (error: any) {
      logger.error({ error: error.message, stack: error.stack, logId: log.id }, 'Failed to save/update audit log');
      return null;
    }
  }

  /**
   * Save audit log with fire-and-forget pattern
   * This is a non-blocking operation that attempts to save in the background
   * BUT also tries to save immediately first to ensure it happens
   */
  async saveUnsafe(log: IngressAuditLog): Promise<void> {
    // First, try to save immediately (non-blocking with timeout)
    Promise.race([
      this.save(log),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 1000)
      )
    ]).catch((error) => {
      // If immediate save fails or times out, queue it for later
      logger.warn({ logId: log.id, error: error.message }, 'Immediate audit log save failed, queuing for later');
      
      // Queue for later execution (but don't block)
      setImmediate(async () => {
        try {
          await this.save(log);
        } catch (err: any) {
          logger.error({ logId: log.id, error: err.message }, 'Failed to save audit log in background');
        }
      });
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

