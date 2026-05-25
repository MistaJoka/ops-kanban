import { NextResponse } from 'next/server';

import { DomainError, type DomainErrorCode } from '@/lib/domain/errors';

export type MappedError = {
  message: string;
  status: number;
  code: string;
};

const RLS_CODES = new Set(['42501', 'PGRST301']);
const NOT_FOUND_CODES = new Set(['PGRST116']);

function extractPostgresCode(message: string): string | null {
  const match = message.match(/\b(42501|PGRST116|PGRST301|PGRST205)\b/);
  return match?.[1] ?? null;
}

export function mapSupabaseError(error: unknown): MappedError {
  if (error instanceof Error) {
    const code = extractPostgresCode(error.message);

    if (code && NOT_FOUND_CODES.has(code)) {
      return { message: 'Resource not found.', status: 404, code: 'NOT_FOUND' };
    }

    if (code && RLS_CODES.has(code)) {
      return { message: 'You do not have permission to perform this action.', status: 403, code: 'FORBIDDEN' };
    }

    if (/timeout|ECONNREFUSED|ENOTFOUND|fetch failed|connection/i.test(error.message)) {
      return { message: 'Database temporarily unavailable.', status: 503, code: 'SERVICE_UNAVAILABLE' };
    }

    return { message: error.message, status: 500, code: 'INTERNAL_ERROR' };
  }

  return { message: 'An unexpected error occurred.', status: 500, code: 'INTERNAL_ERROR' };
}

export function mapDomainError(error: unknown): MappedError {
  if (error instanceof DomainError) {
    return { message: error.message, status: statusForCode(error.code), code: error.code };
  }

  if (error instanceof Error) {
    const withCode = error as Error & { code?: string };

    if (withCode.code === 'NOT_FOUND') {
      return { message: error.message, status: 404, code: 'NOT_FOUND' };
    }

    if (withCode.code === 'FORBIDDEN') {
      return { message: error.message, status: 403, code: 'FORBIDDEN' };
    }

    if (withCode.code === 'VALIDATION_ERROR') {
      return { message: error.message, status: 400, code: 'VALIDATION_ERROR' };
    }
  }

  return mapSupabaseError(error);
}

function statusForCode(code: DomainErrorCode): number {
  switch (code) {
    case 'NOT_FOUND':
      return 404;
    case 'FORBIDDEN':
      return 403;
    case 'VALIDATION_ERROR':
      return 400;
  }
}

export function domainErrorToResponse(error: unknown): NextResponse {
  const mapped = mapDomainError(error);
  return NextResponse.json(
    { error: mapped.message, code: mapped.code },
    { status: mapped.status },
  );
}
