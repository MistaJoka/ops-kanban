import type { SupabaseClient } from '@supabase/supabase-js';

export const DEV_USER_EMAIL = 'dev-bypass@opsboard.local';

export type ResetDevBoardResult = {
  deletedCards: number;
  deletedCustomers: number;
};

export async function resetOrganizationBoardData(
  client: SupabaseClient,
  organizationId: string,
): Promise<ResetDevBoardResult> {
  const { count: deletedCards, error: cardsError } = await client
    .from('cards')
    .delete({ count: 'exact' })
    .eq('organization_id', organizationId);

  if (cardsError) {
    throw new Error(cardsError.message);
  }

  const { count: deletedCustomers, error: customersError } = await client
    .from('customers')
    .delete({ count: 'exact' })
    .eq('organization_id', organizationId);

  if (customersError) {
    throw new Error(customersError.message);
  }

  return {
    deletedCards: deletedCards ?? 0,
    deletedCustomers: deletedCustomers ?? 0,
  };
}

export async function findDevOrganizationId(
  client: SupabaseClient,
): Promise<string | null> {
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id')
    .eq('email', DEV_USER_EMAIL)
    .maybeSingle();

  if (profileError || !profile) {
    return null;
  }

  const { data: membership, error: membershipError } = await client
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', profile.id)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  return membership.organization_id;
}
