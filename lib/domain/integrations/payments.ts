import type { SupabaseClient } from '@supabase/supabase-js';

import { stripePaymentAdapter, isStripeConfigured } from '@/lib/integrations/stripe/adapter';
import { logActivity } from '@/lib/domain/activities/logActivity';
import { InvoiceError } from '@/lib/domain/money/invoices';
import { getInvoiceForCard } from '@/lib/domain/money/invoices';
import { roundMoney } from '@/lib/domain/money/moneyMath';

export type PaymentView = {
  id: string;
  invoiceId: string;
  provider: string;
  amount: number;
  status: string;
  paymentUrl: string | null;
  externalId: string;
};

export async function createInvoicePaymentLink(
  client: SupabaseClient,
  organizationId: string,
  invoiceId: string,
  actorId: string | null,
  options: {
    successUrl: string;
    cancelUrl: string;
    customerEmail?: string | null;
  },
): Promise<PaymentView> {
  if (!isStripeConfigured()) {
    throw new InvoiceError('Stripe is not configured for this environment.', 'VALIDATION_ERROR');
  }

  const { data: invoice, error } = await client
    .from('invoices')
    .select('id, card_id, status, balance_due, total')
    .eq('id', invoiceId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error || !invoice) {
    throw new InvoiceError('Invoice not found.', 'NOT_FOUND');
  }

  if (invoice.status === 'paid') {
    throw new InvoiceError('Invoice is already paid.', 'VALIDATION_ERROR');
  }

  const amount = roundMoney(Number(invoice.balance_due));
  if (amount <= 0) {
    throw new InvoiceError('Nothing due on this invoice.', 'VALIDATION_ERROR');
  }

  const link = await stripePaymentAdapter.createPaymentLink({
    invoiceId: invoice.id,
    cardId: invoice.card_id,
    organizationId,
    amount,
    currency: 'usd',
    customerEmail: options.customerEmail,
    successUrl: options.successUrl,
    cancelUrl: options.cancelUrl,
  });

  const { data: payment, error: paymentError } = await client
    .from('payments')
    .upsert(
      {
        organization_id: organizationId,
        card_id: invoice.card_id,
        invoice_id: invoice.id,
        provider: 'stripe',
        external_id: link.externalId,
        amount,
        currency: 'usd',
        status: 'pending',
        payment_url: link.url,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'organization_id,provider,external_id' },
    )
    .select('id, invoice_id, provider, amount, status, payment_url, external_id')
    .single();

  if (paymentError || !payment) {
    throw new InvoiceError(paymentError?.message ?? 'Failed to save payment link.', 'INTERNAL');
  }

  await logActivity(client, {
    organizationId,
    actorId,
    entityType: 'invoice',
    entityId: invoice.id,
    action: 'payment.link_created',
    summary: `Stripe payment link created ($${amount.toFixed(2)})`,
    metadata: { provider: 'stripe', external_id: link.externalId },
  });

  return {
    id: payment.id,
    invoiceId: payment.invoice_id,
    provider: payment.provider,
    amount: Number(payment.amount),
    status: payment.status,
    paymentUrl: payment.payment_url,
    externalId: payment.external_id,
  };
}

export async function getLatestPaymentForInvoice(
  client: SupabaseClient,
  organizationId: string,
  invoiceId: string,
): Promise<PaymentView | null> {
  const { data, error } = await client
    .from('payments')
    .select('id, invoice_id, provider, amount, status, payment_url, external_id')
    .eq('organization_id', organizationId)
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    invoiceId: data.invoice_id,
    provider: data.provider,
    amount: Number(data.amount),
    status: data.status,
    paymentUrl: data.payment_url,
    externalId: data.external_id,
  };
}

export async function createPortalPaymentLink(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    origin: string;
    customerEmail?: string | null;
  },
): Promise<PaymentView> {
  const invoice = await getInvoiceForCard(client, params.organizationId, params.cardId);
  if (!invoice) {
    throw new InvoiceError('No invoice found for this job.', 'NOT_FOUND');
  }

  return createInvoicePaymentLink(client, params.organizationId, invoice.id, null, {
    successUrl: `${params.origin}/p/thanks?paid=1`,
    cancelUrl: `${params.origin}/p/cancel`,
    customerEmail: params.customerEmail,
  });
}

export async function getInvoiceForCardPaymentContext(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
) {
  const invoice = await getInvoiceForCard(client, organizationId, cardId);
  if (!invoice) {
    return { invoice: null, payment: null };
  }

  const payment = await getLatestPaymentForInvoice(client, organizationId, invoice.id);
  return { invoice, payment };
}
