import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { bookingIdempotencyKey } from '@/lib/domain/booking/bookingPages';
import { upsertCustomerForCard } from '@/lib/domain/customers/upsertCustomer';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';

export type CreateBookingInput = {
  organizationId: string;
  serviceKey: string;
  serviceLabel: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerAddress?: string | null;
  scheduledStart: string;
  notes?: string | null;
  idempotencyKey?: string;
};

export type CreateBookingResult = {
  cardId: string;
  idempotent: boolean;
};

async function resolveColumnId(
  client: SupabaseClient,
  organizationId: string,
  boardId: string,
  stateKey: string,
): Promise<string> {
  const { data, error } = await client
    .from('columns')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('board_id', boardId)
    .eq('state_key', stateKey)
    .single();

  if (error || !data) {
    throw new Error(`Column "${stateKey}" not found.`);
  }

  return data.id;
}

export async function createBooking(
  client: SupabaseClient,
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  const idempotencyKey =
    input.idempotencyKey ??
    bookingIdempotencyKey({
      organizationId: input.organizationId,
      email: input.customerEmail.trim().toLowerCase(),
      scheduledStart: input.scheduledStart,
      serviceKey: input.serviceKey,
    });

  const { data: existingRequest } = await client
    .from('booking_requests')
    .select('card_id')
    .eq('organization_id', input.organizationId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existingRequest?.card_id) {
    return { cardId: existingRequest.card_id, idempotent: true };
  }

  const board = await getPrimaryBoard(client, input.organizationId, true);
  const columnId = await resolveColumnId(client, input.organizationId, board.id, 'site_visit');
  const title = `${input.serviceLabel} — ${input.customerName.trim()}`;

  const { data: card, error: cardError } = await client
    .from('cards')
    .insert({
      organization_id: input.organizationId,
      board_id: board.id,
      column_id: columnId,
      title,
      description: input.notes?.trim() || null,
      job_type: input.serviceKey === 'consultation' ? 'other' : 'maintenance',
      priority: 'medium',
      scheduled_start: input.scheduledStart,
      next_action: 'Confirm visit details with customer',
    })
    .select('id')
    .single();

  if (cardError || !card) {
    throw new Error(cardError?.message ?? 'Failed to create booking card.');
  }

  await upsertCustomerForCard(client, input.organizationId, card.id, null, {
    name: input.customerName.trim(),
    email: input.customerEmail.trim(),
    phone: input.customerPhone?.trim() || null,
    address: input.customerAddress?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  await client.from('booking_requests').insert({
    organization_id: input.organizationId,
    idempotency_key: idempotencyKey,
    card_id: card.id,
  });

  await client.from('integration_events').insert({
    organization_id: input.organizationId,
    provider: 'native',
    event_type: 'booking.created',
    external_id: idempotencyKey,
    payload_json: {
      service_key: input.serviceKey,
      scheduled_start: input.scheduledStart,
      customer_email: input.customerEmail,
    },
    process_status: 'processed',
    card_id: card.id,
    processed_at: new Date().toISOString(),
  });

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: null,
    entityType: 'card',
    entityId: card.id,
    action: 'booking.created',
    summary: `Online booking: ${title}`,
    metadata: {
      service_key: input.serviceKey,
      scheduled_start: input.scheduledStart,
    },
  });

  return { cardId: card.id, idempotent: false };
}
