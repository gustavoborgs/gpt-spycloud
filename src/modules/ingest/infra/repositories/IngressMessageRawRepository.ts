import { PrismaClient } from '@prisma/client';
import { IngressMessageRaw } from '../../domain/IngressMessageRaw';
import { BaseRepository } from '../../../../infra/db/repositories/base/BaseRepository';
import { IngressMessageRawMapper } from '../mappers/IngressMessageRawMapper';

export class IngressMessageRawRepository extends BaseRepository<IngressMessageRaw> {
  constructor(prisma: PrismaClient) {
    super(prisma);
  }

  async findById(id: string): Promise<IngressMessageRaw | null> {
    const prismaMessage = await this.prisma.ingressMessageRaw.findUnique({
      where: { id },
    });

    return prismaMessage ? IngressMessageRawMapper.toDomain(prismaMessage) : null;
  }

  async save(message: IngressMessageRaw): Promise<IngressMessageRaw> {
    const prismaData = IngressMessageRawMapper.toPersistence(message);

    const prismaMessage = await this.prisma.ingressMessageRaw.create({
      data: prismaData,
    });

    return IngressMessageRawMapper.toDomain(prismaMessage);
  }

  async findUnprocessed(limit: number = 100): Promise<IngressMessageRaw[]> {
    const prismaMessages = await this.prisma.ingressMessageRaw.findMany({
      where: {
        processedAt: null,
      },
      take: limit,
      orderBy: { createdAt: 'asc' },
    });

    return prismaMessages.map(IngressMessageRawMapper.toDomain);
  }
}

