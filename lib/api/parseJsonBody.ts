import type { z } from 'zod';

import { jsonError } from '@/lib/api/response';

type ParseSuccess<T> = { ok: true; data: T };
type ParseFailure = { ok: false; response: ReturnType<typeof jsonError> };

export async function parseJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<ParseSuccess<z.infer<T>> | ParseFailure> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return { ok: false, response: jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR') };
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return {
      ok: false,
      response: jsonError(
        parsed.error.issues[0]?.message ?? 'Invalid request.',
        400,
        'VALIDATION_ERROR',
      ),
    };
  }

  return { ok: true, data: parsed.data };
}
