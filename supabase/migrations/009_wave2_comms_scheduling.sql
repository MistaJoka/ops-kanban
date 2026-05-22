-- Wave 2: booking, scheduling, messages, templates

create table if not exists booking_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  title text not null default 'Book a visit',
  service_types jsonb not null default '[]'::jsonb,
  slot_duration_minutes integer not null default 60 check (slot_duration_minutes > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id),
  unique (slug)
);

create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  idempotency_key text not null,
  card_id uuid references cards(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create table if not exists schedule_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  assignee_id uuid references profiles(id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  channel text not null check (channel in ('sms', 'email')),
  subject text,
  body text not null,
  variables jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name, channel)
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  channel text not null check (channel in ('sms', 'email')),
  direction text not null check (direction in ('inbound', 'outbound')),
  body text not null,
  subject text,
  provider text not null,
  external_id text,
  template_id uuid references message_templates(id) on delete set null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'failed', 'received')),
  created_at timestamptz not null default now()
);

create unique index if not exists messages_provider_external_idx
  on messages (organization_id, provider, external_id)
  where external_id is not null;

create index if not exists messages_card_created_idx on messages (organization_id, card_id, created_at desc);
create index if not exists schedule_events_org_starts_idx on schedule_events (organization_id, starts_at);
create index if not exists booking_pages_slug_idx on booking_pages (slug);
