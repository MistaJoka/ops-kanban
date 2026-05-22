import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { canManageMoney } from '@/lib/domain/auth/roles';
import { InvoiceError, createInvoiceDraft } from '@/lib/domain/money/invoices';

const createSchema = z.object({
  fromQuoteId: z.string().uuid().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

  if (!canManageMoney(context.role)) {
    return jsonError('Your role cannot manage invoices.', 403, 'FORBIDDEN');
  }

  const { id } = await params;

  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim()) {
      body = JSON.parse(text);
    }
  } catch {
    return jsonError('Invalid JSON body.', 400, 'VALIDATION_ERROR');
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const invoice = await createInvoiceDraft(
      context.client,
      context.organizationId,
      id,
      context.userId,
      parsed.data.fromQuoteId,
    );

    return jsonData(invoice);
  } catch (error) {
    if (error instanceof InvoiceError) {
      const status = error.code === 'NOT_FOUND' ? 404 : 400;
      return jsonError(error.message, status, error.code);
    }

    const message = error instanceof Error ? error.message : 'Failed to create invoice.';
    return jsonError(message, 500);
  }
}
