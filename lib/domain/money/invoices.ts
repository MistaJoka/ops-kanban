import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { recordInvoiceIssued } from '@/lib/domain/accounting/recordTransaction';
import type { OrgRole } from '@/lib/domain/auth/roles';
import { computeBalanceDue, roundMoney } from '@/lib/domain/money/moneyMath';
import { settleInvoicePayment } from '@/lib/domain/money/settleInvoice';
import { getQuoteForCard } from '@/lib/domain/money/quotes';

export type InvoiceView = {
  id: string;
  cardId: string;
  status: string;
  total: number;
  balanceDue: number;
  dueDate: string | null;
};

export class InvoiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'InvoiceError';
  }
}

export async function getInvoiceForCard(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<InvoiceView | null> {
  const { data, error } = await client
    .from('invoices')
    .select('id, card_id, status, total, balance_due, due_date')
    .eq('organization_id', organizationId)
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    cardId: data.card_id,
    status: data.status,
    total: Number(data.total),
    balanceDue: Number(data.balance_due),
    dueDate: data.due_date,
  };
}

export async function createInvoiceDraft(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
  actorId: string | null,
  fromQuoteId?: string,
): Promise<InvoiceView> {
  const existing = await getInvoiceForCard(client, organizationId, cardId);
  if (existing && existing.status !== 'void') {
    throw new InvoiceError('An invoice already exists for this job.', 'VALIDATION_ERROR');
  }

  const quote = fromQuoteId
    ? await getQuoteForCard(client, organizationId, cardId)
    : await getQuoteForCard(client, organizationId, cardId);

  if (!quote || quote.total <= 0) {
    throw new InvoiceError(
      'Save an estimate with line items before creating an invoice.',
      'VALIDATION_ERROR',
    );
  }

  if (fromQuoteId && quote.id !== fromQuoteId) {
    throw new InvoiceError('Quote does not belong to this card.', 'VALIDATION_ERROR');
  }

  const total = roundMoney(quote.total);

  const { data: created, error } = await client
    .from('invoices')
    .insert({
      organization_id: organizationId,
      card_id: cardId,
      status: 'draft',
      total,
      balance_due: computeBalanceDue(total),
    })
    .select('id, card_id, status, total, balance_due, due_date')
    .single();

  if (error || !created) {
    throw new InvoiceError(error?.message ?? 'Failed to create invoice.', 'INTERNAL');
  }

  await logActivity(client, {
    organizationId,
    actorId,
    entityType: 'invoice',
    entityId: created.id,
    action: 'invoice.drafted',
    summary: `Invoice draft created (${total.toFixed(2)})`,
    metadata: { card_id: cardId, quote_id: quote.id },
  });

  const { data: cardRow } = await client
    .from('cards')
    .select('title, customer_id')
    .eq('id', cardId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  try {
    await recordInvoiceIssued(client, {
      organizationId,
      invoiceId: created.id,
      cardId,
      customerId: (cardRow?.customer_id as string | null) ?? null,
      amount: total,
      description: `${(cardRow?.title as string | undefined) ?? 'Invoice'} — $${total.toFixed(2)}`,
      occurredAt: new Date().toISOString(),
    });
  } catch {
    // Ledger must not block invoice creation.
  }

  return {
    id: created.id,
    cardId: created.card_id,
    status: created.status,
    total: Number(created.total),
    balanceDue: Number(created.balance_due),
    dueDate: created.due_date,
  };
}

export async function markInvoicePaid(
  client: SupabaseClient,
  organizationId: string,
  invoiceId: string,
  actorId: string | null,
  role: OrgRole,
  method?: string,
): Promise<InvoiceView> {
  return settleInvoicePayment(client, {
    organizationId,
    invoiceId,
    actorId,
    role,
    method: method ?? 'manual',
  });
}
