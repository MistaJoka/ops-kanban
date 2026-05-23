import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { canCreateCard, type OrgRole } from '@/lib/domain/auth/roles';

export type CreateCustomerInput = {
  organizationId: string;
  actorId: string | null;
  role: OrgRole;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
};

export type CustomerRecord = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export async function createCustomer(
  client: SupabaseClient,
  input: CreateCustomerInput,
): Promise<CustomerRecord> {
  if (!canCreateCard(input.role)) {
    throw new Error('Your role cannot create customers.');
  }

  const name = input.name.trim();
  if (!name) {
    throw new Error('Customer name is required.');
  }

  const { data, error } = await client
    .from('customers')
    .insert({
      organization_id: input.organizationId,
      name,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      address: input.address?.trim() || null,
      notes: input.notes?.trim() || null,
    })
    .select('id, name, phone, email, address, notes')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create customer.');
  }

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: 'customer',
    entityId: data.id,
    action: 'customer.created',
    summary: `Created customer "${name}"`,
    metadata: {},
  });

  return data as CustomerRecord;
}
