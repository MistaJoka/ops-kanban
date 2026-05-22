import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { QuoteError, markQuoteSent, upsertQuoteDraft } from '@/lib/domain/money/quotes';

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().trim().min(1),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
});

const upsertSchema = z.object({
  lineItems: z.array(lineItemSchema).min(1),
  taxRate: z.number().min(0).max(1).optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage estimates.', 403, 'FORBIDDEN');
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const quote = await upsertQuoteDraft(
      context.client,
      context.organizationId,
      id,
      context.userId,
      parsed.data.lineItems,
      parsed.data.taxRate ?? 0,
    );

    return jsonData(quote);
  } catch (error) {
    if (error instanceof QuoteError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 400;
      return jsonError(error.message, status, error.code);
    }

    const message = error instanceof Error ? error.message : 'Failed to save estimate.';
    return jsonError(message, 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage estimates.', 403, 'FORBIDDEN');
  }

  const { id: cardId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = z.object({ status: z.literal('sent') }).safeParse(body);
  if (!parsed.success) {
    return jsonError('Only status "sent" is supported.', 400, 'VALIDATION_ERROR');
  }

  try {
    const { data: quote, error } = await context.client
      .from('quotes')
      .select('id')
      .eq('card_id', cardId)
      .eq('organization_id', context.organizationId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !quote) {
      return jsonError('Save an estimate before marking sent.', 404, 'NOT_FOUND');
    }

    const updated = await markQuoteSent(
      context.client,
      context.organizationId,
      quote.id,
      context.userId,
    );

    return jsonData(updated);
  } catch (error) {
    if (error instanceof QuoteError) {
      return jsonError(error.message, 400, error.code);
    }

    const message = error instanceof Error ? error.message : 'Failed to update estimate.';
    return jsonError(message, 500);
  }
}
