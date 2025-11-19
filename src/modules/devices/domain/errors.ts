import { DomainError } from '../../../core/errors/DomainError';

export class DeviceAlreadyBoundError extends DomainError {
  constructor(serialNumber: string) {
    super(`Device ${serialNumber} is already bound to an asset`);
  }
}

export class DeviceNotFoundError extends DomainError {
  constructor(identifier: string) {
    super(`Device not found: ${identifier}`);
  }
}

export class InvalidDeviceModelError extends DomainError {
  constructor(modelId: string) {
    super(`Invalid device model: ${modelId}`);
  }
}

