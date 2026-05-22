import type { SupabaseClient } from '@supabase/supabase-js';

export type SignatureView = {
  id: string;
  cardId: string;
  quoteId: string | null;
  signerName: string | null;
  signedAt: string;
  signerIp: string | null;
  provider: 'native' | 'docusign';
  externalId: string | null;
};

export async function recordSignature(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    quoteId?: string | null;
    signerName?: string | null;
    signerIp?: string | null;
    provider: 'native' | 'docusign';
    externalId?: string | null;
  },
): Promise<SignatureView> {
  const { data, error } = await client
    .from('signatures')
    .insert({
      organization_id: params.organizationId,
      card_id: params.cardId,
      quote_id: params.quoteId ?? null,
      signer_name: params.signerName ?? null,
      signer_ip: params.signerIp ?? null,
      provider: params.provider,
      external_id: params.externalId ?? null,
      signed_at: new Date().toISOString(),
    })
    .select('id, card_id, quote_id, signer_name, signed_at, signer_ip, provider, external_id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to record signature.');
  }

  return mapSignature(data);
}

export async function listCardSignatures(
  client: SupabaseClient,
  organizationId: string,
  cardId: string,
): Promise<SignatureView[]> {
  const { data, error } = await client
    .from('signatures')
    .select('id, card_id, quote_id, signer_name, signed_at, signer_ip, provider, external_id')
    .eq('organization_id', organizationId)
    .eq('card_id', cardId)
    .order('signed_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(mapSignature);
}

function mapSignature(row: {
  id: string;
  card_id: string;
  quote_id: string | null;
  signer_name: string | null;
  signed_at: string;
  signer_ip: string | null;
  provider: string;
  external_id: string | null;
}): SignatureView {
  return {
    id: row.id,
    cardId: row.card_id,
    quoteId: row.quote_id,
    signerName: row.signer_name,
    signedAt: row.signed_at,
    signerIp: row.signer_ip,
    provider: row.provider as 'native' | 'docusign',
    externalId: row.external_id,
  };
}
