import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { roundMoney } from '@/lib/domain/money/moneyMath';

export type QuoteLineItemInput = {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type QuoteItemView = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
};

export type QuoteView = {
  id: string;
  cardId: string;
  status: string;
  subtotal: number;
  tax: number;
  total: number;
  items: QuoteItemView[];
};

export function computeQuoteTotals(items: QuoteLineItemInput[], taxRate = 0) {
  const computedItems = items
    .filter((item) => item.description.trim())
    .map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      return {
        description: item.description.trim(),
        quantity,
        unitPrice,
        total: roundMoney(quantity * unitPrice),
      };
    });

  const subtotal = roundMoney(computedItems.reduce((sum, item) => sum + item.total, 0));
  const tax = roundMoney(subtotal * taxRate);
  const total = roundMoney(subtotal + tax);

  return { subtotal, tax, total, items: computedItems };
}

export async function getQuoteForCard(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<QuoteView | null> {
  const { data: quote, error } = await client
    .from('quotes')
    .select(
      'id, card_id, status, subtotal, tax, total, quote_items(id, description, quantity, unit_price, total)',
    )
    .eq('organization_id', organizationId)
    .eq('card_id', cardId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!quote) {
    return null;
  }

  const items = (quote.quote_items as Array<Record<string, unknown>> | null) ?? [];

  return {
    id: quote.id,
    cardId: quote.card_id,
    status: quote.status,
    subtotal: Number(quote.subtotal),
    tax: Number(quote.tax),
    total: Number(quote.total),
    items: items.map((item) => ({
      id: String(item.id),
      description: String(item.description),
      quantity: Number(item.quantity),
      unitPrice: Number(item.unit_price),
      total: Number(item.total),
    })),
  };
}

export class QuoteError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'QuoteError';
  }
}

export async function upsertQuoteDraft(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
  actorId: string | null,
  lineItems: QuoteLineItemInput[],
  taxRate = 0,
): Promise<QuoteView> {
  const { data: card, error: cardError } = await client
    .from('cards')
    .select('id')
    .eq('id', cardId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (cardError || !card) {
    throw new QuoteError('Card not found.', 'NOT_FOUND');
  }

  const totals = computeQuoteTotals(lineItems, taxRate);
  const existing = await getQuoteForCard(client, organizationId, cardId);

  if (existing?.status === 'sent') {
    throw new QuoteError(
      'Sent estimates cannot be edited. Create a revision in a future release.',
      'FORBIDDEN',
    );
  }

  let quoteId = existing?.id;

  if (quoteId) {
    const { error: updateError } = await client
      .from('quotes')
      .update({
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', quoteId)
      .eq('organization_id', organizationId);

    if (updateError) {
      throw new QuoteError(updateError.message, 'INTERNAL');
    }

    const { error: deleteError } = await client
      .from('quote_items')
      .delete()
      .eq('quote_id', quoteId);

    if (deleteError) {
      throw new QuoteError(deleteError.message, 'INTERNAL');
    }
  } else {
    const { data: created, error: createError } = await client
      .from('quotes')
      .insert({
        organization_id: organizationId,
        card_id: cardId,
        status: 'draft',
        subtotal: totals.subtotal,
        tax: totals.tax,
        total: totals.total,
      })
      .select('id')
      .single();

    if (createError || !created) {
      throw new QuoteError(createError?.message ?? 'Failed to create quote.', 'INTERNAL');
    }

    quoteId = created.id;
  }

  if (totals.items.length > 0) {
    const { error: itemsError } = await client.from('quote_items').insert(
      totals.items.map((item) => ({
        quote_id: quoteId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      })),
    );

    if (itemsError) {
      throw new QuoteError(itemsError.message, 'INTERNAL');
    }
  }

  await logActivity(client, {
    organizationId,
    actorId,
    entityType: 'quote',
    entityId: quoteId!,
    action: 'quote.drafted',
    summary: `Updated estimate (${totals.total.toFixed(2)})`,
    metadata: { card_id: cardId, total: totals.total },
  });

  const quote = await getQuoteForCard(client, organizationId, cardId);
  if (!quote) {
    throw new QuoteError('Quote not found after save.', 'INTERNAL');
  }

  return quote;
}

export async function markQuoteSent(
  client: SupabaseClient,
  organizationId: string,
  quoteId: string,
  actorId: string | null,
): Promise<QuoteView> {
  const { data: quote, error } = await client
    .from('quotes')
    .select('id, card_id, total')
    .eq('id', quoteId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (error || !quote) {
    throw new QuoteError('Quote not found.', 'NOT_FOUND');
  }

  if (Number(quote.total) <= 0) {
    throw new QuoteError('Add line items before marking estimate sent.', 'VALIDATION_ERROR');
  }

  const { error: updateError } = await client
    .from('quotes')
    .update({ status: 'sent', updated_at: new Date().toISOString() })
    .eq('id', quoteId)
    .eq('organization_id', organizationId);

  if (updateError) {
    throw new QuoteError(updateError.message, 'INTERNAL');
  }

  await logActivity(client, {
    organizationId,
    actorId,
    entityType: 'quote',
    entityId: quoteId,
    action: 'quote.sent',
    summary: `Estimate sent (${Number(quote.total).toFixed(2)})`,
    metadata: { card_id: quote.card_id },
  });

  const updated = await getQuoteForCard(client, organizationId, quote.card_id);
  if (!updated) {
    throw new QuoteError('Quote not found after update.', 'INTERNAL');
  }

  return updated;
}
