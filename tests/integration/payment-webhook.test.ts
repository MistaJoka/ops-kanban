import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { createCard } from '@/lib/domain/cards/createCard';
import { processPaymentWebhook } from '@/lib/domain/integrations/processPaymentWebhook';
import { createInvoiceDraft } from '@/lib/domain/money/invoices';
import { getQuoteForCard, upsertQuoteDraft } from '@/lib/domain/money/quotes';
import type { WebhookEvent } from '@/lib/integrations/types';
import { POST as paypalWebhookPost } from '@/app/api/webhooks/paypal/route';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied, hasWave1MigrationsApplied } from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());
const wave1Ready = integrationReady && (await hasWave1MigrationsApplied());

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

async function seedInvoice(user: Awaited<ReturnType<typeof createTestUser>>, total = 500) {
  const service = createServiceClient();
  const card = await createCard(service, {
    organizationId: user.organizationId,
    boardId: user.boardId,
    columnId: await getColumnId(service, user.boardId, 'complete'),
    title: 'Webhook test job',
    actorId: user.id,
    role: 'owner',
  });

  await upsertQuoteDraft(service, user.organizationId, card.id, user.id, [
    { description: 'Cleanup', quantity: 1, unitPrice: total },
  ]);

  const quote = await getQuoteForCard(service, user.organizationId, card.id);
  const invoice = await createInvoiceDraft(
    service,
    user.organizationId,
    card.id,
    user.id,
    quote!.id,
  );

  return { service, card, invoice };
}

function buildPaymentEvent(params: {
  organizationId: string;
  invoiceId: string;
  cardId: string;
  amount: number;
  externalId?: string;
  eventType?: WebhookEvent['eventType'];
}): WebhookEvent {
  return {
    provider: 'paypal',
    eventType: params.eventType ?? 'payment.completed',
    externalId: params.externalId ?? `PAYPAL-ORDER-${randomUUID()}`,
    organizationId: params.organizationId,
    invoiceId: params.invoiceId,
    cardId: params.cardId,
    amount: params.amount,
    currency: 'usd',
    raw: { fixture: true },
  };
}

describe.skipIf(!wave1Ready)('WH-PAY payment webhooks', () => {
  it('WH-PAY-001: invalid signature returns 401', async () => {
    const previous = process.env.PAYPAL_WEBHOOK_ID;
    process.env.PAYPAL_WEBHOOK_ID = 'WH-TEST-INVALID';

    try {
      const response = await paypalWebhookPost(
        new Request('http://localhost/api/webhooks/paypal', {
          method: 'POST',
          body: JSON.stringify({ event_type: 'PAYMENT.CAPTURE.COMPLETED' }),
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      expect(response.status).toBe(401);
    } finally {
      if (previous) {
        process.env.PAYPAL_WEBHOOK_ID = previous;
      } else {
        delete process.env.PAYPAL_WEBHOOK_ID;
      }
    }
  });

  it('WH-PAY-002: payment.completed settles invoice and archives card', async () => {
    const user = await createTestUser('wh-pay-002');
    const { service, card, invoice } = await seedInvoice(user);

    try {
      const event = buildPaymentEvent({
        organizationId: user.organizationId,
        invoiceId: invoice.id,
        cardId: card.id,
        amount: invoice.balanceDue,
      });

      const result = await processPaymentWebhook(service, event);
      expect(result.status).toBe('processed');

      const { data: updatedInvoice } = await service
        .from('invoices')
        .select('status, balance_due')
        .eq('id', invoice.id)
        .single();

      expect(updatedInvoice?.status).toBe('paid');
      expect(Number(updatedInvoice?.balance_due)).toBe(0);

      const { data: updatedCard } = await service
        .from('cards')
        .select('archived_at, columns!inner(state_key)')
        .eq('id', card.id)
        .single();

      expect(updatedCard?.archived_at).toBeTruthy();
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-PAY-003: duplicate external_id is idempotent', async () => {
    const user = await createTestUser('wh-pay-003');
    const { service, card, invoice } = await seedInvoice(user, 320);
    const externalId = `PAYPAL-ORDER-${randomUUID()}`;

    try {
      const event = buildPaymentEvent({
        organizationId: user.organizationId,
        invoiceId: invoice.id,
        cardId: card.id,
        amount: invoice.balanceDue,
        externalId,
      });

      const first = await processPaymentWebhook(service, event);
      expect(first.status).toBe('processed');

      const second = await processPaymentWebhook(service, event);
      expect(second.status).toBe('skipped');
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-PAY-004: amount mismatch marks integration event failed', async () => {
    const user = await createTestUser('wh-pay-004');
    const { service, card, invoice } = await seedInvoice(user, 275);

    try {
      const event = buildPaymentEvent({
        organizationId: user.organizationId,
        invoiceId: invoice.id,
        cardId: card.id,
        amount: 1,
      });

      const result = await processPaymentWebhook(service, event);
      expect(result.status).toBe('failed');

      const { data: row } = await service
        .from('integration_events')
        .select('process_status')
        .eq('organization_id', user.organizationId)
        .eq('external_id', event.externalId)
        .single();

      expect(row?.process_status).toBe('failed');

      const { data: unchanged } = await service
        .from('invoices')
        .select('status, balance_due')
        .eq('id', invoice.id)
        .single();

      expect(unchanged?.status).not.toBe('paid');
      expect(Number(unchanged?.balance_due)).toBe(invoice.balanceDue);
      expect(card.id).toBeTruthy();
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-PAY-005: invoice/card mismatch does not settle', async () => {
    const user = await createTestUser('wh-pay-005');
    const { service, card, invoice } = await seedInvoice(user, 410);
    const otherCard = await createCard(service, {
      organizationId: user.organizationId,
      boardId: user.boardId,
      columnId: await getColumnId(service, user.boardId, 'complete'),
      title: 'Other card',
      actorId: user.id,
      role: 'owner',
    });

    try {
      const event = buildPaymentEvent({
        organizationId: user.organizationId,
        invoiceId: invoice.id,
        cardId: otherCard.id,
        amount: invoice.balanceDue,
      });

      const result = await processPaymentWebhook(service, event);
      expect(result.status).toBe('failed');
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-PAY-006: payment.failed leaves balance unchanged', async () => {
    const user = await createTestUser('wh-pay-006');
    const { service, card, invoice } = await seedInvoice(user, 180);

    try {
      const event = buildPaymentEvent({
        organizationId: user.organizationId,
        invoiceId: invoice.id,
        cardId: card.id,
        amount: 0,
        eventType: 'payment.failed',
      });

      const result = await processPaymentWebhook(service, event);
      expect(result.status).toBe('processed');

      const { data: unchanged } = await service
        .from('invoices')
        .select('status, balance_due')
        .eq('id', invoice.id)
        .single();

      expect(unchanged?.status).not.toBe('paid');
      expect(Number(unchanged?.balance_due)).toBe(invoice.balanceDue);
    } finally {
      await deleteTestUser(user);
    }
  });
});
