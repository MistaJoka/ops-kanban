import type { SupabaseClient } from '@supabase/supabase-js';

export type CustomerListItem = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  jobCount: number;
  updatedAt: string;
};

export async function listCustomers(
  client: SupabaseClient,
  organizationId: string,
): Promise<CustomerListItem[]> {
  const { data: customers, error } = await client
    .from('customers')
    .select('id, name, phone, email, address, updated_at')
    .eq('organization_id', organizationId)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const { data: cardCounts, error: countError } = await client
    .from('cards')
    .select('customer_id')
    .eq('organization_id', organizationId)
    .not('customer_id', 'is', null);

  if (countError) {
    throw new Error(countError.message);
  }

  const countMap = new Map<string, number>();
  for (const row of cardCounts ?? []) {
    const id = row.customer_id as string;
    countMap.set(id, (countMap.get(id) ?? 0) + 1);
  }

  return (customers ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    address: (row.address as string | null) ?? null,
    jobCount: countMap.get(row.id as string) ?? 0,
    updatedAt: row.updated_at as string,
  }));
}
