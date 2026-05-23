import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';

export type ContractFrequency = 'weekly' | 'biweekly' | 'monthly' | 'seasonal';

export type ContractView = {
  id: string;
  customerId: string;
  customerName: string;
  title: string;
  jobType: string | null;
  frequency: ContractFrequency;
  nextRunAt: string;
  amount: number | null;
  active: boolean;
  lastCardId: string | null;
  createdAt: string;
};

export type CreateContractInput = {
  organizationId: string;
  customerId: string;
  title: string;
  jobType?: string | null;
  frequency: ContractFrequency;
  nextRunAt: string;
  amount?: number | null;
  actorId: string | null;
};

function addFrequency(date: Date, frequency: ContractFrequency): Date {
  const next = new Date(date);
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'seasonal':
      next.setMonth(next.getMonth() + 3);
      break;
  }
  return next;
}

function mapRow(row: Record<string, unknown>, customerName: string): ContractView {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    customerName,
    title: row.title as string,
    jobType: (row.job_type as string | null) ?? null,
    frequency: row.frequency as ContractFrequency,
    nextRunAt: row.next_run_at as string,
    amount: row.amount != null ? Number(row.amount) : null,
    active: Boolean(row.active),
    lastCardId: (row.last_card_id as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function listContracts(
  client: SupabaseClient,
  organizationId: string,
): Promise<ContractView[]> {
  const { data, error } = await client
    .from('contracts')
    .select('*, customers(name)')
    .eq('organization_id', organizationId)
    .order('next_run_at', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers;
    return mapRow(row, (customer?.name as string) ?? 'Customer');
  });
}

export async function createContract(
  client: SupabaseClient,
  input: CreateContractInput,
): Promise<ContractView> {
  const { data, error } = await client
    .from('contracts')
    .insert({
      organization_id: input.organizationId,
      customer_id: input.customerId,
      title: input.title.trim(),
      job_type: input.jobType ?? null,
      frequency: input.frequency,
      next_run_at: input.nextRunAt,
      amount: input.amount ?? null,
      active: true,
    })
    .select('*, customers(name)')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create contract.');
  }

  const customer = Array.isArray(data.customers) ? data.customers[0] : data.customers;

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: input.actorId,
    entityType: 'customer',
    entityId: input.customerId,
    action: 'contract.created',
    summary: `Recurring contract created: ${input.title.trim()}`,
    metadata: { frequency: input.frequency },
  });

  return mapRow(data, (customer?.name as string) ?? 'Customer');
}

export async function generateContractCard(
  client: SupabaseClient,
  organizationId: string,
  contractId: string,
  actorId: string | null,
): Promise<{ cardId: string; contract: ContractView }> {
  const { data: contract, error } = await client
    .from('contracts')
    .select('*, customers(name)')
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !contract) {
    throw new Error('Contract not found.');
  }

  if (!contract.active) {
    throw new Error('Contract is inactive.');
  }

  const board = await getPrimaryBoard(client, organizationId);
  const targetColumn =
    board.columns.find((column) => column.stateKey === 'scheduled') ??
    board.columns.find((column) => column.stateKey === 'inquiry');

  if (!targetColumn) {
    throw new Error('No suitable column found on the primary board.');
  }

  const { data: card, error: cardError } = await client
    .from('cards')
    .insert({
      organization_id: organizationId,
      board_id: board.id,
      column_id: targetColumn.id,
      customer_id: contract.customer_id,
      title: contract.title,
      job_type: contract.job_type,
      priority: 'medium',
      scheduled_start: contract.next_run_at,
    })
    .select('id')
    .single();

  if (cardError || !card) {
    throw new Error(cardError?.message ?? 'Failed to create contract job.');
  }

  const nextRunAt = addFrequency(
    new Date(contract.next_run_at as string),
    contract.frequency as ContractFrequency,
  );

  const { data: updated, error: updateError } = await client
    .from('contracts')
    .update({
      last_card_id: card.id,
      next_run_at: nextRunAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .select('*, customers(name)')
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? 'Failed to update contract schedule.');
  }

  await logActivity(client, {
    organizationId,
    actorId,
    entityType: 'card',
    entityId: card.id,
    action: 'contract.generated',
    summary: `Recurring job created from contract "${contract.title as string}"`,
    metadata: { contract_id: contractId },
  });

  const customer = Array.isArray(updated.customers) ? updated.customers[0] : updated.customers;

  return {
    cardId: card.id,
    contract: mapRow(updated, (customer?.name as string) ?? 'Customer'),
  };
}
