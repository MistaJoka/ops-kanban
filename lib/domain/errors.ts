export type DomainErrorCode = 'NOT_FOUND' | 'FORBIDDEN' | 'VALIDATION_ERROR';

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: DomainErrorCode,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
