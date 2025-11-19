import { UseCase } from '../../../../core/application/UseCase';
import { Result, ok, fail } from '../../../../core/utils/Result';
import { TelemetryRepository } from '../../infra/repositories/TelemetryRepository';
import { DecodedTelemetry } from '../../domain/DecodedTelemetry';
import { logger } from '../../../../config/logger';

export class SaveDecodedMessageUseCase implements UseCase<DecodedTelemetry, void> {
  constructor(private telemetryRepository: TelemetryRepository) {}

  async execute(request: DecodedTelemetry): Promise<Result<void>> {
    try {
      await this.telemetryRepository.save(request);
      logger.debug({ deviceSerialNumber: request.deviceSerialNumber }, 'Decoded telemetry saved');
      return ok(undefined);
    } catch (error: any) {
      logger.error({ error, deviceSerialNumber: request.deviceSerialNumber }, 'Failed to save decoded telemetry');
      return fail(error.message || 'Failed to save telemetry', 500);
    }
  }
}

