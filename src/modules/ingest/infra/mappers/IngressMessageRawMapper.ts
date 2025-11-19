import { IngressMessageRaw as PrismaIngressMessageRaw } from '@prisma/client';
import { IngressMessageRaw, IngressMessageRawProps } from '../../domain/IngressMessageRaw';
import { SourceType } from '../../domain/SourceType';

export class IngressMessageRawMapper {
  static toDomain(prismaMessage: PrismaIngressMessageRaw): IngressMessageRaw {
    const props: IngressMessageRawProps = {
      rawPayload: prismaMessage.rawPayload,
      sourceType: prismaMessage.sourceType as SourceType,
      sourceIdentifier: prismaMessage.sourceIdentifier || undefined,
      deviceSerialNumber: prismaMessage.deviceSerialNumber || undefined,
      metadata: prismaMessage.metadata as Record<string, any> | undefined,
    };

    return IngressMessageRaw.create(
      props,
      prismaMessage.id,
      prismaMessage.createdAt,
      prismaMessage.updatedAt
    );
  }

  static toPersistence(message: IngressMessageRaw): Omit<PrismaIngressMessageRaw, 'id' | 'createdAt' | 'updatedAt'> {
    return {
      rawPayload: message.rawPayload,
      sourceType: message.sourceType,
      sourceIdentifier: message.sourceIdentifier || null,
      deviceSerialNumber: message.deviceSerialNumber || null,
      metadata: message.metadata || null,
      processedAt: null,
    };
  }
}

