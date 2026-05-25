import { describe, expect, it } from 'vitest';

import { createAutomation } from '@/lib/domain/automations/crud';
import { moveCard } from '@/lib/domain/cards/moveCard';
import { createContract, generateContractCard } from '@/lib/domain/contracts/contracts';
import { createCard } from '@/lib/domain/cards/createCard';
import { getReportsSummary } from '@/lib/domain/reports/getReports';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied, hasWave4MigrationsApplied } from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());
const wave4Ready = integrationReady && (await hasWave4MigrationsApplied());

async function getColumnId(
  service: ReturnType<typeof createServiceClient>,
  boardId: string,
  stateKey: string,
) {
  const { data } = await service
    .from('columns')
    .select('id')
    .eq('board_id', boardId)
    .eq('state_key', stateKey)
    .single();

  return data!.id;
}

describe.skipIf(!wave4Ready)('INT-W4 Wave 4 scale', () => {
  it('INT-W4-001: reports summary returns real aggregates', async () => {
    const user = await createTestUser('w4-reports');
    const service = createServiceClient();

    try {
      await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'inquiry'),
        title: 'Report seed card',
        jobType: 'maintenance',
        actorId: user.id,
        role: 'owner',
      });

      const summary = await getReportsSummary(service, user.organizationId);
      expect(summary.conversionByColumn.length).toBeGreaterThan(0);
      expect(summary.totalRevenue).toBeGreaterThanOrEqual(0);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-W4-002: column automation logs activity on move', async () => {
    const user = await createTestUser('w4-auto');
    const service = createServiceClient();

    try {
      await createAutomation(service, {
        organizationId: user.organizationId,
        name: 'Scheduled follow-up',
        triggerType: 'column_enter',
        triggerStateKey: 'scheduled',
        actionType: 'log_activity',
        actionConfig: { summary: 'Automation fired for scheduled job.' },
      });

      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'approved'),
        title: 'Automation test card',
        actorId: user.id,
        role: 'owner',
      });

      const scheduledStart = new Date(Date.now() + 86_400_000).toISOString();
      const { error: scheduleError } = await service
        .from('cards')
        .update({ scheduled_start: scheduledStart })
        .eq('id', card.id)
        .eq('organization_id', user.organizationId);
      expect(scheduleError).toBeNull();

      await moveCard(service, {
        organizationId: user.organizationId,
        cardId: card.id,
        targetColumnId: await getColumnId(service, user.boardId, 'scheduled'),
        actorId: user.id,
        role: 'owner',
      });

      const { data: activities } = await service
        .from('activities')
        .select('action, summary')
        .eq('organization_id', user.organizationId)
        .eq('entity_id', card.id)
        .eq('action', 'automation.ran');

      expect(activities?.length).toBeGreaterThan(0);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-W4-003: contract generates a pipeline card', async () => {
    const user = await createTestUser('w4-contract');
    const service = createServiceClient();

    try {
      const { data: customerRow, error: customerError } = await service
        .from('customers')
        .insert({
          organization_id: user.organizationId,
          name: 'Contract Customer',
          email: 'contract@example.com',
        })
        .select('id')
        .single();

      expect(customerError).toBeNull();
      expect(customerRow?.id).toBeTruthy();

      const contract = await createContract(service, {
        organizationId: user.organizationId,
        customerId: customerRow!.id,
        title: 'Monthly lawn care',
        frequency: 'monthly',
        nextRunAt: new Date().toISOString(),
        actorId: user.id,
      });

      const result = await generateContractCard(service, user.organizationId, contract.id, user.id);
      expect(result.cardId).toBeTruthy();
      expect(result.contract.lastCardId).toBe(result.cardId);

      const { data: card } = await service
        .from('cards')
        .select('id, customer_id, title')
        .eq('id', result.cardId)
        .single();

      expect(card?.customer_id).toBe(customerRow!.id);
      expect(card?.title).toBe('Monthly lawn care');
    } finally {
      await deleteTestUser(user);
    }
  });
});
