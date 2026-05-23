import { describe, expect, it } from 'vitest';

import { createCard } from '@/lib/domain/cards/createCard';
import {
  createInvoiceDraft,
  getInvoiceForCard,
  markInvoicePaid,
} from '@/lib/domain/money/invoices';
import { getQuoteForCard, upsertQuoteDraft } from '@/lib/domain/money/quotes';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied } from '@/tests/helpers/migrate';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());

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

describe.skipIf(!integrationReady)('INT-MNY quotes & invoices', () => {
  it('INT-MNY-003: invoice draft from quote copies total', async () => {
    const user = await createTestUser('money-invoice');
    const service = createServiceClient();

    try {
      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'complete'),
        title: 'Rivera — Spring cleanup',
        actorId: user.id,
        role: 'owner',
      });

      const quote = await upsertQuoteDraft(service, user.organizationId, card.id, user.id, [
        { description: 'Spring cleanup', quantity: 1, unitPrice: 425 },
        { description: 'Debris haul-away', quantity: 1, unitPrice: 75 },
      ]);

      expect(quote.total).toBe(500);

      const invoice = await createInvoiceDraft(
        service,
        user.organizationId,
        card.id,
        user.id,
        quote.id,
      );

      expect(invoice.total).toBe(500);
      expect(invoice.balanceDue).toBe(500);
      expect(invoice.status).toBe('draft');

      const persisted = await getInvoiceForCard(service, user.organizationId, card.id);
      expect(persisted?.total).toBe(500);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-MNY-004: mark paid clears balance and archives card', async () => {
    const user = await createTestUser('money-paid');
    const service = createServiceClient();

    try {
      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'complete'),
        title: 'Paid job',
        actorId: user.id,
        role: 'owner',
      });

      await upsertQuoteDraft(service, user.organizationId, card.id, user.id, [
        { description: 'Cleanup', quantity: 1, unitPrice: 300 },
      ]);

      const quote = await getQuoteForCard(service, user.organizationId, card.id);
      const invoice = await createInvoiceDraft(
        service,
        user.organizationId,
        card.id,
        user.id,
        quote!.id,
      );

      const paid = await markInvoicePaid(
        service,
        user.organizationId,
        invoice.id,
        user.id,
        'owner',
        'check',
      );

      expect(paid.balanceDue).toBe(0);
      expect(paid.status).toBe('paid');

      const { data: updatedCard } = await service
        .from('cards')
        .select('archived_at, columns!inner(state_key)')
        .eq('id', card.id)
        .single();

      expect(updatedCard?.archived_at).toBeTruthy();
      const column = Array.isArray(updatedCard?.columns)
        ? updatedCard.columns[0]
        : updatedCard?.columns;
      expect(column?.state_key).toBe('archived');
    } finally {
      await deleteTestUser(user);
    }
  });
});
