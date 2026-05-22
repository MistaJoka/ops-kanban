import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

import { ensureBookingPage } from '@/lib/domain/booking/bookingPages';
import { createBooking } from '@/lib/domain/booking/createBooking';
import { createTestUser, deleteTestUser } from '@/tests/helpers/auth';
import { hasTestSupabaseEnv } from '@/tests/helpers/env';
import { hasMigrationsApplied, hasWave2MigrationsApplied } from '@/tests/helpers/migrate';
import { createServiceClient } from '@/tests/helpers/supabase';

const integrationReady = hasTestSupabaseEnv() && (await hasMigrationsApplied());
const wave2Ready = integrationReady && (await hasWave2MigrationsApplied());

describe.skipIf(!wave2Ready)('WH-BOOK public booking', () => {
  it('WH-BOOK-001: booking creates site_visit card with schedule', async () => {
    const user = await createTestUser('book-create');
    const service = createServiceClient();

    try {
      const { data: org } = await service
        .from('organizations')
        .select('name')
        .eq('id', user.organizationId)
        .single();

      const page = await ensureBookingPage(service, user.organizationId, org!.name);
      const email = `alex+${randomUUID()}@example.com`;
      const scheduledStart = new Date(Date.now() + 86_400_000).toISOString();
      const idempotencyKey = `book-${randomUUID()}`;

      const first = await createBooking(service, {
        organizationId: user.organizationId,
        serviceKey: 'site_visit',
        serviceLabel: 'Site visit',
        customerName: 'Alex Rivera',
        customerEmail: email,
        customerPhone: '+15551234567',
        customerAddress: '123 Oak St',
        scheduledStart,
        idempotencyKey,
      });

      expect(first.idempotent).toBe(false);

      const { data: card } = await service
        .from('cards')
        .select('id, scheduled_start, columns!inner(state_key)')
        .eq('id', first.cardId)
        .single();

      expect(card?.scheduled_start).toBeTruthy();
      const column = Array.isArray(card?.columns) ? card.columns[0] : card?.columns;
      expect(column?.state_key).toBe('site_visit');

      const duplicate = await createBooking(service, {
        organizationId: user.organizationId,
        serviceKey: 'site_visit',
        serviceLabel: 'Site visit',
        customerName: 'Alex Rivera',
        customerEmail: email,
        scheduledStart,
        idempotencyKey,
      });

      expect(duplicate.idempotent).toBe(true);
      expect(duplicate.cardId).toBe(first.cardId);
      expect(page.slug.length).toBeGreaterThan(3);
    } finally {
      await deleteTestUser(user);
    }
  });
});
