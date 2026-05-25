import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { bookingIdempotencyKey } from '@/lib/domain/booking/bookingPages';
import { getPrimaryBoard } from '@/lib/domain/board/getBoard';
import { claimBookingRequest } from '@/lib/domain/mutations/idempotency';

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

  const claim = await claimBookingRequest(client, input.organizationId, idempotencyKey);
  if (claim.status === 'cached') {
    return { cardId: claim.cardId, idempotent: true };
  }

  const board = await getPrimaryBoard(client, input.organizationId, true);
  const columnId = await resolveColumnId(client, input.organizationId, board.id, 'site_visit');
  const title = `${input.serviceLabel} — ${input.customerName.trim()}`;

  const { data: cardId, error: rpcError } = await client.rpc('create_booking_atomic', {
    p_organization_id: input.organizationId,
    p_board_id: board.id,
    p_column_id: columnId,
    p_idempotency_key: idempotencyKey,
    p_title: title,
    p_description: input.notes?.trim() || null,
    p_job_type: input.serviceKey === 'consultation' ? 'other' : 'maintenance',
    p_scheduled_start: input.scheduledStart,
    p_next_action: 'Confirm visit details with customer',
    p_customer_name: input.customerName.trim(),
    p_customer_email: input.customerEmail.trim(),
    p_customer_phone: input.customerPhone?.trim() || '',
    p_customer_address: input.customerAddress?.trim() || '',
    p_customer_notes: input.notes?.trim() || '',
    p_service_key: input.serviceKey,
    p_service_label: input.serviceLabel,
  });

  if (rpcError || !cardId) {
    throw new Error(rpcError?.message ?? 'Atomic booking create failed.');
  }

  await logActivity(client, {
    organizationId: input.organizationId,
    actorId: null,
    entityType: 'card',
    entityId: cardId as string,
    action: 'booking.created',
    summary: `Online booking: ${title}`,
    metadata: {
      service_key: input.serviceKey,
      scheduled_start: input.scheduledStart,
    },
  });

  return { cardId: cardId as string, idempotent: false };
}
