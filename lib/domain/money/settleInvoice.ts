import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { recordPaymentReceived } from '@/lib/domain/accounting/recordTransaction';
import { runAutomationsForInvoicePaid } from '@/lib/domain/automations/runAutomations';
import type { OrgRole } from '@/lib/domain/auth/roles';
import { canManageMoney } from '@/lib/domain/auth/roles';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import { InvoiceError } from '@/lib/domain/money/invoices';
import { roundMoney } from '@/lib/domain/money/moneyMath';

async function getArchivedColumnId(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<string> {
  const { data: card, error: cardError } = await client
    .from('cards')
    .select('board_id')
    .eq('id', cardId)
    .eq('organization_id', organizationId)
    .single();

  if (cardError || !card) {
    throw new InvoiceError('Card not found.', 'NOT_FOUND');
  }

  const { data: column, error: columnError } = await client
    .from('columns')
    .select('id')
    .eq('board_id', card.board_id)
    .eq('organization_id', organizationId)
    .eq('state_key', 'archived')
    .single();

  if (columnError || !column) {
    throw new InvoiceError('Archived column not found.', 'NOT_FOUND');
  }

  return column.id;
}

export async function settleInvoicePayment(
  client: SupabaseClient,
  params: {
    organizationId: string;
    invoiceId: string;
    actorId: string | null;
    role?: OrgRole;
    method: string;
    skipRoleCheck?: boolean;
  },
): Promise<InvoiceView> {
  if (!params.skipRoleCheck && params.role && !canManageMoney(params.role)) {
    throw new InvoiceError('Your role cannot mark invoices paid.', 'FORBIDDEN');
  }

  const { data: invoice, error } = await client
    .from('invoices')
    .select('id, card_id, status, total, balance_due, due_date')
    .eq('id', params.invoiceId)
    .eq('organization_id', params.organizationId)
    .maybeSingle();

  if (error || !invoice) {
    throw new InvoiceError('Invoice not found.', 'NOT_FOUND');
  }

  if (invoice.status === 'paid') {
    throw new InvoiceError('Invoice is already marked paid.', 'VALIDATION_ERROR');
  }

  const archivedColumnId = await getArchivedColumnId(
    client,
    params.organizationId,
    invoice.card_id,
  );

  const { error: invoiceError } = await client
    .from('invoices')
    .update({
      status: 'paid',
      balance_due: 0,
      updated_at: new Date().toISOString(),
    })
    .eq('id', params.invoiceId)
    .eq('organization_id', params.organizationId);

  if (invoiceError) {
    throw new InvoiceError(invoiceError.message, 'INTERNAL');
  }

  const { error: cardError } = await client
    .from('cards')
    .update({
      column_id: archivedColumnId,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', invoice.card_id)
    .eq('organization_id', params.organizationId);

  if (cardError) {
    throw new InvoiceError(cardError.message, 'INTERNAL');
  }

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'invoice',
    entityId: params.invoiceId,
    action: 'invoice.paid',
    summary: `Invoice paid (${roundMoney(Number(invoice.total)).toFixed(2)})`,
    metadata: {
      card_id: invoice.card_id,
      method: params.method,
    },
  });

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'card',
    entityId: invoice.card_id,
    action: 'card.moved',
    summary: 'Moved to archived after payment',
    metadata: {
      to_state_key: 'archived',
      reason: 'Payment recorded',
      method: params.method,
    },
  });

  const { data: cardRow } = await client
    .from('cards')
    .select('title, customer_id')
    .eq('id', invoice.card_id)
    .eq('organization_id', params.organizationId)
    .maybeSingle();

  try {
    await recordPaymentReceived(client, {
      organizationId: params.organizationId,
      invoiceId: params.invoiceId,
      cardId: invoice.card_id,
      customerId: (cardRow?.customer_id as string | null) ?? null,
      amount: Number(invoice.total),
      description: `${(cardRow?.title as string | undefined) ?? 'Payment'} — $${roundMoney(Number(invoice.total)).toFixed(2)} (${params.method})`,
    });
  } catch {
    // Ledger must not block payment settlement.
  }

  try {
    await runAutomationsForInvoicePaid(client, {
      organizationId: params.organizationId,
      cardId: invoice.card_id,
      cardTitle: (cardRow?.title as string) ?? 'Job',
      actorId: params.actorId,
    });
  } catch {
    // Automations must not block payment settlement.
  }

  return {
    id: invoice.id,
    cardId: invoice.card_id,
    status: 'paid',
    total: Number(invoice.total),
    balanceDue: 0,
    dueDate: invoice.due_date,
  };
}
