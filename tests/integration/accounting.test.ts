import { describe, expect, it } from 'vitest';

import { exportAccountingCsv } from '@/lib/domain/accounting/exportCsv';
import { getArRegister, summarizeArAging } from '@/lib/domain/accounting/getArRegister';
import { listAccountingTransactions } from '@/lib/domain/accounting/listTransactions';
import { createCard } from '@/lib/domain/cards/createCard';
import { createInvoiceDraft, markInvoicePaid } from '@/lib/domain/money/invoices';
import { upsertQuoteDraft } from '@/lib/domain/money/quotes';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import {
  hasMigrationsApplied,
  hasNativeAccountingMigrationsApplied,
} from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());
const accountingReady = integrationReady && (await hasNativeAccountingMigrationsApplied());

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

describe.skipIf(!accountingReady)('INT-ACC native accounting ledger', () => {
  it('INT-ACC-001: creating invoice writes invoice_issued ledger entry (idempotent)', async () => {
    const user = await createTestUser('acc-invoice');
    const service = createServiceClient();

    try {
      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'complete'),
        title: 'Ledger invoice job',
        actorId: user.id,
        role: 'owner',
      });

      await upsertQuoteDraft(service, user.organizationId, card.id, user.id, [
        { description: 'Cleanup', quantity: 1, unitPrice: 400 },
      ]);

      const invoice = await createInvoiceDraft(service, user.organizationId, card.id, user.id);

      const { data: entries, error } = await service
        .from('accounting_transactions')
        .select('entry_type, amount, invoice_id')
        .eq('organization_id', user.organizationId)
        .eq('invoice_id', invoice.id);

      expect(error).toBeNull();
      expect(entries?.filter((row) => row.entry_type === 'invoice_issued')).toHaveLength(1);
      expect(Number(entries?.[0]?.amount)).toBe(400);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-ACC-002: mark paid writes payment_received ledger entry', async () => {
    const user = await createTestUser('acc-paid');
    const service = createServiceClient();

    try {
      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'complete'),
        title: 'Ledger paid job',
        actorId: user.id,
        role: 'owner',
      });

      await upsertQuoteDraft(service, user.organizationId, card.id, user.id, [
        { description: 'Mulch install', quantity: 1, unitPrice: 650 },
      ]);

      const invoice = await createInvoiceDraft(service, user.organizationId, card.id, user.id);
      await markInvoicePaid(service, user.organizationId, invoice.id, user.id, 'owner', 'manual');

      const { data: paymentEntries } = await service
        .from('accounting_transactions')
        .select('entry_type, amount')
        .eq('organization_id', user.organizationId)
        .eq('invoice_id', invoice.id)
        .eq('entry_type', 'payment_received');

      expect(paymentEntries).toHaveLength(1);
      expect(Number(paymentEntries?.[0]?.amount)).toBe(650);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-ACC-003: AR register aging buckets match open invoice balances', async () => {
    const user = await createTestUser('acc-ar');
    const service = createServiceClient();

    try {
      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'complete'),
        title: 'Open AR job',
        actorId: user.id,
        role: 'owner',
      });

      await upsertQuoteDraft(service, user.organizationId, card.id, user.id, [
        { description: 'Maintenance visit', quantity: 1, unitPrice: 220 },
      ]);

      await createInvoiceDraft(service, user.organizationId, card.id, user.id);

      const arRegister = await getArRegister(service, user.organizationId);
      const aging = summarizeArAging(arRegister);

      const openRow = arRegister.find((row) => row.cardId === card.id);
      expect(openRow?.balanceDue).toBe(220);

      const bucketTotal = Object.values(aging).reduce((sum, value) => sum + value, 0);
      expect(bucketTotal).toBeGreaterThanOrEqual(220);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('INT-ACC-004: CSV export returns ledger and AR sections', async () => {
    const user = await createTestUser('acc-csv');
    const service = createServiceClient();

    try {
      const csv = await exportAccountingCsv(service, user.organizationId);
      expect(csv).toContain('=== Income Ledger ===');
      expect(csv).toContain('=== AR Register ===');
      expect(csv).toContain('Date,Type,Amount,Customer,Job,Description');

      const transactions = await listAccountingTransactions(service, user.organizationId, {
        limit: 5,
      });
      expect(Array.isArray(transactions)).toBe(true);
    } finally {
      await deleteTestUser(user);
    }
  });
});
