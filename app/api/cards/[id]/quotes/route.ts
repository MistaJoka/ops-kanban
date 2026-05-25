import { z } from 'zod';

import { parseJsonBody } from '@/lib/api/parseJsonBody';
import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
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

const markSentSchema = z.object({ status: z.literal('sent') });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot manage estimates.', 403, 'FORBIDDEN');
      }

      const { id } = await params;

      const parsed = await parseJsonBody(req, upsertSchema);
      if (!parsed.ok) {
        return parsed.response;
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
    },
    { route: '/api/cards/[id]/quotes' },
  );
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!canManageMoney(context.role)) {
        return jsonError('Your role cannot manage estimates.', 403, 'FORBIDDEN');
      }

      const { id: cardId } = await params;

      const parsed = await parseJsonBody(req, markSentSchema);
      if (!parsed.ok) {
        const payload = (await parsed.response.clone().json()) as { error?: string };
        if (payload.error === 'Invalid JSON body.') {
          return parsed.response;
        }
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
    },
    { route: '/api/cards/[id]/quotes' },
  );
}
