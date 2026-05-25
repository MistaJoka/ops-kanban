import { jsonData, jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { createInvoicePaymentLink } from '@/lib/domain/integrations/payments';
import { InvoiceError } from '@/lib/domain/money/invoices';
import { isStripeConfigured } from '@/lib/integrations/stripe/adapter';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    request,
    async (context, req) => {
      if (!isStripeConfigured()) {
        return jsonError('Stripe is not configured.', 503, 'SERVICE_UNAVAILABLE');
      }

      const { id } = await params;
      const origin = new URL(req.url).origin;

      try {
        const payment = await createInvoicePaymentLink(
          context.client,
          context.organizationId,
          id,
          context.userId,
          {
            successUrl: `${origin}/pipeline?payment=success`,
            cancelUrl: `${origin}/pipeline?payment=cancelled`,
          },
        );

        return jsonData(payment);
      } catch (error) {
        if (error instanceof InvoiceError) {
          const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'FORBIDDEN' ? 403 : 400;
          return jsonError(error.message, status, error.code);
        }
        throw error;
      }
    },
    { route: '/api/invoices/[id]/payment-link' },
  );
}
