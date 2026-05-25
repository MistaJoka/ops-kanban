import type { SupabaseClient } from '@supabase/supabase-js';

import { normalizePhone } from '@/lib/domain/comms/messages';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function findCustomerByContact(
  client: SupabaseClient,
  organizationId: string,
  phone?: string | null,
  email?: string | null,
): Promise<{ id: string } | null> {
  const normalizedPhone = phone ? normalizePhone(phone) : '';
  const normalizedEmail = email ? normalizeEmail(email) : '';

  if (!normalizedPhone && !normalizedEmail) {
    return null;
  }

  const { data: customers, error } = await client
    .from('customers')
    .select('id, phone, email')
    .eq('organization_id', organizationId);

  if (error || !customers?.length) {
    return null;
  }

  const match = customers.find((customer) => {
    if (normalizedPhone && customer.phone) {
      if (normalizePhone(String(customer.phone)) === normalizedPhone) {
        return true;
      }
    }
    if (normalizedEmail && customer.email) {
      if (normalizeEmail(String(customer.email)) === normalizedEmail) {
        return true;
      }
    }
    return false;
  });

  return match ? { id: match.id as string } : null;
}

export async function findOpenCardByCustomerContact(
  client: SupabaseClient,
  organizationId: string,
  phone?: string | null,
  email?: string | null,
): Promise<{ cardId: string; customerId: string } | null> {
  const customer = await findCustomerByContact(client, organizationId, phone, email);
  if (!customer) {
    return null;
  }

  const { data: card } = await client
    .from('cards')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('customer_id', customer.id)
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!card) {
    return null;
  }

  return { cardId: card.id as string, customerId: customer.id };
}
