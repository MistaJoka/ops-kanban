import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { createCard } from '@/lib/domain/cards/createCard';
import {
  claimClientMutation,
  completeClientMutation,
  readIdempotentResponse,
  writeIdempotentResponse,
} from '@/lib/domain/mutations/idempotency';
import { processIntake } from '@/lib/domain/intake/processIntake';
import { inquiryIdempotencyKey } from '@/lib/domain/intake/inquiryPages';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasInquiryMigrationsApplied, hasMigrationsApplied } from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());

async function hasClientMutationsTable(): Promise<boolean> {
  try {
    const service = createServiceClient();
    const { error } = await service.from('client_mutations').select('id').limit(1);
    return error === null;
  } catch {
    return false;
  }
}

const idempotencyReady = integrationReady && (await hasClientMutationsTable());

describe.skipIf(!idempotencyReady)('INT-IDEM client mutations', () => {
  it('INT-IDEM-001: stores and returns cached mutation response', async () => {
    const user = await createTestUser('idem-001');
    const service = createServiceClient();
    const mutationId = randomUUID();

    try {
      const columnId = (
        await service
          .from('columns')
          .select('id')
          .eq('board_id', user.boardId)
          .eq('state_key', 'inquiry')
          .single()
      ).data!.id;

      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId,
        title: 'Idempotency test card',
        actorId: user.id,
        role: 'owner',
      });

      await writeIdempotentResponse(service, {
        organizationId: user.organizationId,
        clientMutationId: mutationId,
        response: card,
        httpStatus: 201,
        cardId: card.id,
      });

      const cached = await readIdempotentResponse(
        service,
        user.organizationId,
        mutationId,
      );

      expect(cached?.httpStatus).toBe(201);
      expect(cached?.response).toMatchObject({ id: card.id, title: card.title });
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-IDEM-002: concurrent claims return one completed mutation', async () => {
    const user = await createTestUser('idem-002');
    const service = createServiceClient();
    const mutationId = randomUUID();

    try {
      const columnId = (
        await service
          .from('columns')
          .select('id')
          .eq('board_id', user.boardId)
          .eq('state_key', 'inquiry')
          .single()
      ).data!.id;

      const claims = await Promise.all([
        claimClientMutation(service, user.organizationId, mutationId),
        claimClientMutation(service, user.organizationId, mutationId),
      ]);

      const claimedCount = claims.filter((claim) => claim?.status === 'claimed').length;
      const cachedCount = claims.filter((claim) => claim?.status === 'cached').length;
      expect(claimedCount + cachedCount).toBe(2);
      expect(claimedCount).toBe(1);

      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId,
        title: 'Concurrent idempotency card',
        actorId: user.id,
        role: 'owner',
      });

      await completeClientMutation(service, {
        organizationId: user.organizationId,
        clientMutationId: mutationId,
        response: card,
        httpStatus: 201,
        cardId: card.id,
      });

      const [firstRead, secondRead] = await Promise.all([
        readIdempotentResponse(service, user.organizationId, mutationId),
        readIdempotentResponse(service, user.organizationId, mutationId),
      ]);

      expect(firstRead?.response).toMatchObject({ id: card.id });
      expect(secondRead?.response).toMatchObject({ id: card.id });
    } finally {
      await deleteTestUser(user);
    }
  });
});

const inquiryIdemReady =
  idempotencyReady && (await hasInquiryMigrationsApplied());

describe.skipIf(!inquiryIdemReady)('INT-IDEM inquiry requests', () => {
  it('INT-IDEM-003: parallel processIntake with same key creates one card', async () => {
    const user = await createTestUser('idem-inq');
    const service = createServiceClient();
    const email = `parallel+${randomUUID()}@example.com`;
    const idempotencyKey = inquiryIdempotencyKey({
      organizationId: user.organizationId,
      email,
      message: 'Parallel intake test message',
    });

    try {
      const input = {
        organizationId: user.organizationId,
        channel: 'web' as const,
        source: 'website',
        idempotencyKey,
        customerName: 'Parallel Pat',
        customerEmail: email,
        message: 'Parallel intake test message',
      };

      const [first, second] = await Promise.all([
        processIntake(service, input),
        processIntake(service, input),
      ]);

      expect(first.cardId).toBe(second.cardId);

      const { count } = await service
        .from('cards')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', user.organizationId)
        .ilike('description', '%Parallel intake test message%');

      expect(count).toBe(1);
    } finally {
      await deleteTestUser(user);
    }
  });
});
