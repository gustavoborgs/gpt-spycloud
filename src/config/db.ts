import { PrismaClient } from '@prisma/client';
import { logger } from './logger';
import { env } from './env';

let prisma: PrismaClient;

export async function initDb(): Promise<PrismaClient> {
  if (!prisma) {
    prisma = new PrismaClient({
      log:
        env.NODE_ENV === 'development'
          ? [{ emit: 'event', level: 'query' }, { emit: 'stdout', level: 'error' }]
          : [{ emit: 'stdout', level: 'error' }],
    });

    if (env.NODE_ENV === 'development') {
      prisma.$on('query' as never, (e: any) => {
        logger.debug({ query: e.query, params: e.params, duration: `${e.duration}ms` }, 'Prisma query');
      });
    }

    await prisma.$connect();
    logger.info('Database connected successfully');
  }

  return prisma;
}

export function getDb(): PrismaClient {
  if (!prisma) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return prisma;
}

export async function closeDb(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Database connection closed');
  }
}

