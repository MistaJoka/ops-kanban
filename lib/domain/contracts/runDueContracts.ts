import type { SupabaseClient } from '@supabase/supabase-js';

import { generateContractCard } from '@/lib/domain/contracts/contracts';

export type RunDueContractsResult = {
  processed: number;
  generated: Array<{ contractId: string; cardId: string; title: string }>;
  errors: Array<{ contractId: string; message: string }>;
};

export async function runDueContracts(
  client: SupabaseClient,
  organizationId: string,
  actorId: string | null,
  asOf: Date = new Date(),
): Promise<RunDueContractsResult> {
  const { data: due, error } = await client
    .from('contracts')
    .select('id, title, next_run_at')
    .eq('organization_id', organizationId)
    .eq('active', true)
    .lte('next_run_at', asOf.toISOString())
    .order('next_run_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const generated: RunDueContractsResult['generated'] = [];
  const errors: RunDueContractsResult['errors'] = [];

  for (const contract of due ?? []) {
    try {
      const result = await generateContractCard(
        client,
        organizationId,
        contract.id as string,
        actorId,
      );
      generated.push({
        contractId: contract.id as string,
        cardId: result.cardId,
        title: contract.title as string,
      });
    } catch (err) {
      errors.push({
        contractId: contract.id as string,
        message: err instanceof Error ? err.message : 'Generation failed.',
      });
    }
  }

  return {
    processed: due?.length ?? 0,
    generated,
    errors,
  };
}
