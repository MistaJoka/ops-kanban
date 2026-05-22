import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { createCard } from '@/lib/domain/cards/createCard';
import { listCardMessages } from '@/lib/domain/comms/messages';
import { processSmsWebhook } from '@/lib/domain/comms/processSmsWebhook';
import { upsertCustomerForCard } from '@/lib/domain/customers/upsertCustomer';
import type { CommsWebhookEvent } from '@/lib/integrations/types';
import { POST as twilioWebhookPost } from '@/app/api/webhooks/twilio/route';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied, hasWave2MigrationsApplied } from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());
const wave2Ready = integrationReady && (await hasWave2MigrationsApplied());

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

function buildSmsEvent(params: {
  organizationId: string;
  fromPhone: string;
  body: string;
  externalId?: string;
}): CommsWebhookEvent {
  return {
    provider: 'twilio',
    eventType: 'sms.received',
    externalId: params.externalId ?? `SM${randomUUID().replace(/-/g, '')}`,
    organizationId: params.organizationId,
    fromPhone: params.fromPhone,
    toPhone: '+15559876543',
    body: params.body,
    raw: { fixture: true },
  };
}

describe.skipIf(!wave2Ready)('WH-SMS inbound webhooks', () => {
  it('WH-SMS-001: inbound SMS on known phone appends to card thread', async () => {
    const user = await createTestUser('sms-known');
    const service = createServiceClient();

    try {
      const card = await createCard(service, {
        organizationId: user.organizationId,
        boardId: user.boardId,
        columnId: await getColumnId(service, user.boardId, 'inquiry'),
        title: 'SMS match job',
        actorId: user.id,
        role: 'owner',
      });

      await upsertCustomerForCard(service, user.organizationId, card.id, user.id, {
        name: 'Jamie Lee',
        phone: '+15551112222',
      });

      const event = buildSmsEvent({
        organizationId: user.organizationId,
        fromPhone: '+15551112222',
        body: 'Can you come tomorrow morning?',
      });

      const result = await processSmsWebhook(service, event);
      expect(result.status).toBe('processed');

      const messages = await listCardMessages(service, user.organizationId, card.id);
      expect(messages.some((message) => message.body.includes('tomorrow'))).toBe(true);
    } finally {
      await deleteTestUser(user);
    }
  });

  it('WH-SMS-003: invalid signature returns 401', async () => {
    const previous = process.env.TWILIO_AUTH_TOKEN;
    process.env.TWILIO_AUTH_TOKEN = 'test_auth_token';

    try {
      const response = await twilioWebhookPost(
        new Request('http://localhost/api/webhooks/twilio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Twilio-Signature': 'invalid',
          },
          body: new URLSearchParams({
            MessageSid: 'SM123',
            From: '+15550001111',
            Body: 'hello',
          }).toString(),
        }),
      );

      expect(response.status).toBe(401);
    } finally {
      if (previous) {
        process.env.TWILIO_AUTH_TOKEN = previous;
      } else {
        delete process.env.TWILIO_AUTH_TOKEN;
      }
    }
  });

  it('WH-SMS-002: unknown phone creates inquiry card', async () => {
    const user = await createTestUser('sms-unknown');
    const service = createServiceClient();

    try {
      const event = buildSmsEvent({
        organizationId: user.organizationId,
        fromPhone: '+15553334444',
        body: 'Need a quote for backyard cleanup',
      });

      const result = await processSmsWebhook(service, event);
      expect(result.status).toBe('processed');
      if (result.status !== 'processed') return;

      const { data: card } = await service
        .from('cards')
        .select('id, description, columns!inner(state_key)')
        .eq('id', result.cardId)
        .single();

      const column = Array.isArray(card?.columns) ? card.columns[0] : card?.columns;
      expect(column?.state_key).toBe('inquiry');
      expect(card?.description).toContain('cleanup');
    } finally {
      await deleteTestUser(user);
    }
  });
});
