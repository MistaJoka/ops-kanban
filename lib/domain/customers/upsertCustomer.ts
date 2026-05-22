import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';

export type CustomerInput = {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export async function upsertCustomerForCard(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
  actorId: string | null,
  input: CustomerInput,
): Promise<string> {
  const { data: card, error: cardError } = await client
    .from('cards')
    .select('customer_id')
    .eq('id', cardId)
    .eq('organization_id', organizationId)
    .single();

  if (cardError || !card) {
    throw new Error('Card not found.');
  }

  const customerPayload = {
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    address: input.address?.trim() || null,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  let customerId = card.customer_id as string | null;

  if (customerId) {
    const { error } = await client
      .from('customers')
      .update(customerPayload)
      .eq('id', customerId)
      .eq('organization_id', organizationId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data: created, error } = await client
      .from('customers')
      .insert({
        organization_id: organizationId,
        ...customerPayload,
      })
      .select('id')
      .single();

    if (error || !created) {
      throw new Error(error?.message ?? 'Failed to create customer.');
    }

    customerId = created.id;

    const { error: linkError } = await client
      .from('cards')
      .update({ customer_id: customerId, updated_at: new Date().toISOString() })
      .eq('id', cardId)
      .eq('organization_id', organizationId);

    if (linkError) {
      throw new Error(linkError.message);
    }
  }

  if (!customerId) {
    throw new Error('Customer id missing after upsert.');
  }

  await logActivity(client, {
    organizationId,
    actorId,
    entityType: 'customer',
    entityId: customerId,
    action: 'customer.updated',
    summary: `Updated property for job`,
    metadata: { card_id: cardId },
  });

  return customerId;
}
