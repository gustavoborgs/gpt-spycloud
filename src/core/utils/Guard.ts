export class Guard {
  static againstNullOrUndefined<T>(argument: T | null | undefined, argumentName: string): void {
    if (argument === null || argument === undefined) {
      throw new Error(`${argumentName} is null or undefined`);
    }
  }

  static againstEmptyString(argument: string, argumentName: string): void {
    if (argument.trim().length === 0) {
      throw new Error(`${argumentName} is empty`);
    }
  }

  static againstAtLeast(argument: number, min: number, argumentName: string): void {
    if (argument < min) {
      throw new Error(`${argumentName} must be at least ${min}`);
    }
  }

  static againstAtMost(argument: number, max: number, argumentName: string): void {
    if (argument > max) {
      throw new Error(`${argumentName} must be at most ${max}`);
    }
  }
}

