-- Atomic intake create + booking create (P17 TASK-P17-013/014)

create or replace function public.process_intake_create_atomic(
  p_organization_id uuid,
  p_board_id uuid,
  p_column_id uuid,
  p_idempotency_key text,
  p_title text,
  p_description text,
  p_next_action text,
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_customer_address text,
  p_message text,
  p_insert_message boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_id uuid;
  v_customer_id uuid;
begin
  insert into cards (
    organization_id,
    board_id,
    column_id,
    title,
    description,
    next_action,
    priority
  )
  values (
    p_organization_id,
    p_board_id,
    p_column_id,
    p_title,
    p_description,
    p_next_action,
    'medium'
  )
  returning id into v_card_id;

  insert into customers (organization_id, name, phone, email, address)
  values (
    p_organization_id,
    p_customer_name,
    nullif(p_customer_phone, ''),
    nullif(p_customer_email, ''),
    nullif(p_customer_address, '')
  )
  returning id into v_customer_id;

  update cards
  set customer_id = v_customer_id, updated_at = now()
  where id = v_card_id and organization_id = p_organization_id;

  if p_insert_message then
    insert into messages (
      organization_id,
      card_id,
      customer_id,
      channel,
      direction,
      body,
      provider,
      status
    )
    values (
      p_organization_id,
      v_card_id,
      v_customer_id,
      'email',
      'inbound',
      p_message,
      'native',
      'received'
    );
  end if;

  update inquiry_requests
  set card_id = v_card_id
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;

  return v_card_id;
end;
$$;

create or replace function public.create_booking_atomic(
  p_organization_id uuid,
  p_board_id uuid,
  p_column_id uuid,
  p_idempotency_key text,
  p_title text,
  p_description text,
  p_job_type text,
  p_scheduled_start timestamptz,
  p_next_action text,
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_customer_address text,
  p_customer_notes text,
  p_service_key text,
  p_service_label text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_card_id uuid;
  v_customer_id uuid;
begin
  insert into cards (
    organization_id,
    board_id,
    column_id,
    title,
    description,
    job_type,
    priority,
    scheduled_start,
    next_action
  )
  values (
    p_organization_id,
    p_board_id,
    p_column_id,
    p_title,
    p_description,
    p_job_type,
    'medium',
    p_scheduled_start,
    p_next_action
  )
  returning id into v_card_id;

  insert into customers (organization_id, name, email, phone, address, notes)
  values (
    p_organization_id,
    p_customer_name,
    p_customer_email,
    nullif(p_customer_phone, ''),
    nullif(p_customer_address, ''),
    nullif(p_customer_notes, '')
  )
  returning id into v_customer_id;

  update cards
  set customer_id = v_customer_id, updated_at = now()
  where id = v_card_id and organization_id = p_organization_id;

  update booking_requests
  set card_id = v_card_id
  where organization_id = p_organization_id
    and idempotency_key = p_idempotency_key;

  insert into integration_events (
    organization_id,
    provider,
    event_type,
    external_id,
    payload_json,
    process_status,
    card_id,
    processed_at
  )
  values (
    p_organization_id,
    'native',
    'booking.created',
    p_idempotency_key,
    jsonb_build_object(
      'service_key', p_service_key,
      'scheduled_start', p_scheduled_start,
      'customer_email', p_customer_email
    ),
    'processed',
    v_card_id,
    now()
  );

  return v_card_id;
end;
$$;

revoke all on function public.process_intake_create_atomic(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, boolean) from public;
revoke all on function public.create_booking_atomic(uuid, uuid, uuid, text, text, text, text, timestamptz, text, text, text, text, text, text, text, text) from public;

grant execute on function public.process_intake_create_atomic(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text, boolean) to service_role;
grant execute on function public.create_booking_atomic(uuid, uuid, uuid, text, text, text, text, timestamptz, text, text, text, text, text, text, text, text) to service_role;
