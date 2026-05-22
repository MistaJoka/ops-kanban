import { describe, expect, it } from 'vitest';

import { bootstrapWorkspace } from '@/lib/domain/bootstrap/signupBootstrap';
import { createCard } from '@/lib/domain/cards/createCard';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { upsertCustomerForCard } from '@/lib/domain/customers/upsertCustomer';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied } from '@/tests/helpers/migrate';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());

describe.skipIf(!integrationReady)('INT-CARD customer linkage', () => {
  it('INT-CARD-003: customer save linked to card', async () => {
    const user = await createTestUser('card-customer');
    const service = createServiceClient();

    try {
      await bootstrapWorkspace(service, {
        userId: user.id,
        email: user.email,
        fullName: 'Test card-customer',
        organizationName: 'Test card-customer Landscaping',
      });

      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: (
          await service
            .from('columns')
            .select('id')
            .eq('board_id', user.boardId)
            .eq('state_key', 'inquiry')
            .single()
        ).data!.id,
        title: 'Rivera — Spring cleanup',
        actorId: user.id,
        role: 'owner',
      });

      await upsertCustomerForCard(service, user.organizationId, card.id, user.id, {
        name: 'Rivera',
        address: '142 Oak Lane',
      });

      const detail = await getCardDetail(service, user.organizationId, card.id);
      expect(detail?.customer?.name).toBe('Rivera');
      expect(detail?.customer?.address).toBe('142 Oak Lane');
    } finally {
      await deleteTestUser(user);
    }
  });
});
