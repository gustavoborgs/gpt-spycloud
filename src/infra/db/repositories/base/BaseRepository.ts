import { PrismaClient } from '@prisma/client';
import { PaginationDTO, PaginatedResponseDTO } from '../../../../core/application/dto';

export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  protected async paginate<TData>(
    data: TData[],
    total: number,
    pagination: PaginationDTO
  ): Promise<PaginatedResponseDTO<TData>> {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  }
}

