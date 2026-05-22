import type { SupabaseClient } from '@supabase/supabase-js';

import { roundMoney } from '@/lib/domain/money/moneyMath';

export type AccountingEntryType = 'invoice_issued' | 'payment_received';

export type RecordTransactionInput = {
  organizationId: string;
  entryType: AccountingEntryType;
  amount: number;
  customerId?: string | null;
  cardId?: string | null;
  invoiceId: string;
  paymentId?: string | null;
  description: string;
  occurredAt?: string;
};

export async function recordAccountingTransaction(
  client: SupabaseClient,
  input: RecordTransactionInput,
): Promise<void> {
  const amount = roundMoney(input.amount);
  if (amount <= 0) {
    return;
  }

  const { data: existing } = await client
    .from('accounting_transactions')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('entry_type', input.entryType)
    .eq('invoice_id', input.invoiceId)
    .maybeSingle();

  if (existing) {
    return;
  }

  const { error: insertError } = await client.from('accounting_transactions').insert({
    organization_id: input.organizationId,
    entry_type: input.entryType,
    amount,
    customer_id: input.customerId ?? null,
    card_id: input.cardId ?? null,
    invoice_id: input.invoiceId,
    payment_id: input.paymentId ?? null,
    description: input.description,
    occurred_at: input.occurredAt ?? new Date().toISOString(),
  });

  if (insertError && !insertError.message.includes('duplicate')) {
    throw new Error(insertError.message);
  }
}

export async function recordInvoiceIssued(
  client: SupabaseClient,
  params: {
    organizationId: string;
    invoiceId: string;
    cardId: string;
    customerId?: string | null;
    amount: number;
    description: string;
    occurredAt?: string;
  },
): Promise<void> {
  await recordAccountingTransaction(client, {
    organizationId: params.organizationId,
    entryType: 'invoice_issued',
    amount: params.amount,
    customerId: params.customerId,
    cardId: params.cardId,
    invoiceId: params.invoiceId,
    description: params.description,
    occurredAt: params.occurredAt,
  });
}

export async function recordPaymentReceived(
  client: SupabaseClient,
  params: {
    organizationId: string;
    invoiceId: string;
    cardId: string;
    customerId?: string | null;
    amount: number;
    paymentId?: string | null;
    description: string;
    occurredAt?: string;
  },
): Promise<void> {
  await recordAccountingTransaction(client, {
    organizationId: params.organizationId,
    entryType: 'payment_received',
    amount: params.amount,
    customerId: params.customerId,
    cardId: params.cardId,
    invoiceId: params.invoiceId,
    paymentId: params.paymentId,
    description: params.description,
    occurredAt: params.occurredAt,
  });
}
