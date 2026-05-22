import { z } from 'zod';

import { jsonData, jsonError } from '@/lib/api/response';
import { getHandlerContext, isHandlerContext } from '@/lib/domain/api/handlerContext';
import { InvoiceError, markInvoicePaid } from '@/lib/domain/money/invoices';

const markPaidSchema = z.object({
  method: z.string().trim().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = await getHandlerContext();
  if (!isHandlerContext(context)) return context;

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

  const parsed = markPaidSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? 'Invalid request.', 400, 'VALIDATION_ERROR');
  }

  try {
    const invoice = await markInvoicePaid(
      context.client,
      context.organizationId,
      id,
      context.userId,
      context.role,
      parsed.data.method,
    );

    return jsonData(invoice);
  } catch (error) {
    if (error instanceof InvoiceError) {
      const status =
        error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 400;
      return jsonError(error.message, status, error.code);
    }

    const message = error instanceof Error ? error.message : 'Failed to mark invoice paid.';
    return jsonError(message, 500);
  }
}
