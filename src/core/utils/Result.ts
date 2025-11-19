export type Result<T> = Success<T> | Failure;

export class Success<T> {
  readonly value: T;

  constructor(value: T) {
    this.value = value;
  }

  isSuccess(): this is Success<T> {
    return true;
  }

  isFailure(): this is Failure {
    return false;
  }
}

export class Failure {
  readonly error: string;
  readonly statusCode?: number;

  constructor(error: string, statusCode?: number) {
    this.error = error;
    this.statusCode = statusCode;
  }

  isSuccess(): this is Success<never> {
    return false;
  }

  isFailure(): this is Failure {
    return true;
  }
}

export const ok = <T>(value: T): Result<T> => new Success(value);
export const fail = (error: string, statusCode?: number): Result<never> => new Failure(error, statusCode);

