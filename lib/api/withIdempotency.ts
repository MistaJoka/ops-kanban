import type { NextResponse } from 'next/server';

import { jsonData } from '@/lib/api/response';
import type { HandlerContext } from '@/lib/domain/api/handlerContext';
import {
  claimClientMutation,
  completeClientMutation,
  readClientMutationId,
} from '@/lib/domain/mutations/idempotency';

type IdempotentResult<T> = {
  data: T;
  status?: number;
  cardId?: string | null;
};

export async function withIdempotency<T>(
  request: Request,
  context: HandlerContext,
  execute: () => Promise<IdempotentResult<T>>,
): Promise<NextResponse> {
  const clientMutationId = readClientMutationId(request);

  if (clientMutationId) {
    const claim = await claimClientMutation(
      context.client,
      context.organizationId,
      clientMutationId,
    );

    if (claim === null) {
      const result = await execute();
      return jsonData(result.data, result.status ?? 200);
    }

    if (claim.status === 'cached') {
      return jsonData(claim.record.response as T, claim.record.httpStatus);
    }
  }

  const result = await execute();

  if (clientMutationId) {
    await completeClientMutation(context.client, {
      organizationId: context.organizationId,
      clientMutationId,
      response: result.data,
      httpStatus: result.status ?? 200,
      cardId: result.cardId ?? null,
    });
  }

  return jsonData(result.data, result.status ?? 200);
}
