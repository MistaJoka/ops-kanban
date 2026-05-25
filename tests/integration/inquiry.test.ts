import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { createCard } from '@/lib/domain/cards/createCard';
import { ensureInquiryPage, inquiryIdempotencyKey } from '@/lib/domain/intake/inquiryPages';
import { processIntake } from '@/lib/domain/intake/processIntake';
import { upsertCustomerForCard } from '@/lib/domain/customers/upsertCustomer';
import { POST as inquiryPost } from '@/app/api/inquiry/[slug]/route';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import {
  hasInquiryMigrationsApplied,
  hasMigrationsApplied,
  hasWave2MigrationsApplied,
} from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());
const wave2Ready = integrationReady && (await hasWave2MigrationsApplied());
const inquiryReady = wave2Ready && (await hasInquiryMigrationsApplied());

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

describe.skipIf(!inquiryReady)('WH-INQ public inquiry intake', () => {
  it('WH-INQ-001: processIntake creates inquiry card with customer', async () => {
    const user = await createTestUser('inq-create');
    const service = createServiceClient();

    try {
      const { data: org } = await service
        .from('organizations')
        .select('name')
        .eq('id', user.organizationId)
        .single();

      await ensureInquiryPage(service, user.organizationId, org!.name);
      const email = `pat+${randomUUID()}@example.com`;

      const result = await processIntake(service, {
        organizationId: user.organizationId,
        channel: 'web',
        source: 'yard-sign',
        customerName: 'Pat Nguyen',
        customerEmail: email,
        customerPhone: '+15556667777',
        customerAddress: '456 Maple Ave',
        message: 'Need weekly lawn maintenance quote',
      });

      expect(result.created).toBe(true);
      expect(result.attached).toBe(false);

      const { data: card } = await service
        .from('cards')
        .select('id, description, customer_id, columns!inner(state_key), customers(name, email)')
        .eq('id', result.cardId)
        .single();

      const column = Array.isArray(card?.columns) ? card.columns[0] : card?.columns;
      expect(column?.state_key).toBe('inquiry');
      expect(card?.description).toContain('maintenance');
      expect(card?.customer_id).toBeTruthy();

      const customer = Array.isArray(card?.customers) ? card.customers[0] : card?.customers;
      expect(customer?.email).toBe(email);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-INQ-002: duplicate idempotency key returns same card', async () => {
    const user = await createTestUser('inq-dedup');
    const service = createServiceClient();

    try {
      const email = `dedup+${randomUUID()}@example.com`;
      const idempotencyKey = inquiryIdempotencyKey({
        organizationId: user.organizationId,
        email,
        message: 'Same message for dedup test',
      });

      const first = await processIntake(service, {
        organizationId: user.organizationId,
        channel: 'web',
        source: 'website',
        idempotencyKey,
        customerName: 'Alex Kim',
        customerEmail: email,
        message: 'Same message for dedup test',
      });

      const second = await processIntake(service, {
        organizationId: user.organizationId,
        channel: 'web',
        source: 'website',
        idempotencyKey,
        customerName: 'Alex Kim',
        customerEmail: email,
        message: 'Same message for dedup test',
      });

      expect(second.idempotent).toBe(true);
      expect(second.cardId).toBe(first.cardId);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-INQ-003: known email on open card attaches instead of duplicating', async () => {
    const user = await createTestUser('inq-attach');
    const service = createServiceClient();

    try {
      const email = `attach+${randomUUID()}@example.com`;
      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'inquiry'),
        title: 'Open inquiry job',
        actorId: user.id,
        role: 'owner',
      });

      await upsertCustomerForCard(service, user.organizationId, card.id, user.id, {
        name: 'Jordan Lee',
        email,
      });

      const { count: beforeCount } = await service
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId);

      const result = await processIntake(service, {
        organizationId: user.organizationId,
        channel: 'web',
        source: 'website',
        customerName: 'Jordan Lee',
        customerEmail: email,
        message: 'Follow-up question about the estimate timeline',
      });

      expect(result.attached).toBe(true);
      expect(result.created).toBe(false);
      expect(result.cardId).toBe(card.id);

      const { count: afterCount } = await service
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId);

      expect(afterCount).toBe(beforeCount);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-INQ-004: API POST records source in activity metadata', async () => {
    const user = await createTestUser('inq-api');
    const service = createServiceClient();

    try {
      const { data: org } = await service
        .from('organizations')
        .select('name')
        .eq('id', user.organizationId)
        .single();

      const page = await ensureInquiryPage(service, user.organizationId, org!.name);
      const email = `api+${randomUUID()}@example.com`;

      const response = await inquiryPost(
        new Request(`http://localhost/api/inquiry/${page.slug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: 'Sam Ortiz',
            customerEmail: email,
            customerPhone: '+15558889999',
            message: 'Backyard cleanup and mulching',
            source: 'truck-wrap',
            campaign: 'spring-2026',
          }),
        }),
        { params: Promise.resolve({ slug: page.slug }) },
      );

      expect(response.status).toBe(201);
      const payload = await response.json();
      const cardId = payload.data.cardId as string;

      const { data: activity } = await service
        .from('activities')
        .select('metadata')
        .eq('organization_id', user.organizationId)
        .eq('entity_id', cardId)
        .eq('action', 'inquiry.received')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      expect(activity?.metadata).toMatchObject({
        channel: 'web',
        source: 'truck-wrap',
        campaign: 'spring-2026',
      });
    } finally {
      await deleteTestUser(user);
    }
  });
});
