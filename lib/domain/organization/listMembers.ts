import type { SupabaseClient } from '@supabase/supabase-js';

export type OrgMemberView = {
  userId: string;
  fullName: string | null;
  role: string;
};

export async function listOrgMembers(
  client: SupabaseClient,
  organizationId: string,
): Promise<OrgMemberView[]> {
  const { data, error } = await client
    .from('organization_members')
    .select('user_id, role, profiles(full_name)')
    .eq('organization_id', organizationId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      userId: row.user_id,
      fullName: profile?.full_name ?? null,
      role: row.role,
    };
  });
}
