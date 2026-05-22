import { NextResponse } from 'next/server';

export function jsonData<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function jsonError(
  error: string,
  status: number,
  code?: string,
  details?: unknown,
) {
  return NextResponse.json({ error, code, details }, { status });
}
