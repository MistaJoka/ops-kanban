-- Wave 1: payments, integration events, integration accounts, portal tokens

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  invoice_id uuid not null references invoices(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal', 'manual')),
  external_id text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'completed', 'failed', 'cancelled')),
  payment_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, external_id)
);

create table if not exists integration_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null,
  event_type text not null,
  external_id text not null,
  payload_json jsonb not null default '{}'::jsonb,
  process_status text not null default 'pending' check (process_status in ('pending', 'processed', 'failed', 'skipped')),
  card_id uuid references cards(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  error_message text,
  created_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (organization_id, provider, external_id)
);

create table if not exists integration_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  provider text not null check (provider in ('stripe', 'paypal', 'twilio', 'resend', 'docusign', 'calendly', 'quickbooks')),
  status text not null default 'disconnected' check (status in ('active', 'error', 'disconnected')),
  credentials_ref text,
  scopes text[] not null default '{}',
  last_sync_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists portal_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  token_hash text not null unique,
  scopes text[] not null default '{view_estimate}',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payments_org_invoice_idx on payments (organization_id, invoice_id);
create index if not exists integration_events_org_status_idx on integration_events (organization_id, process_status, created_at desc);
create index if not exists portal_tokens_card_idx on portal_tokens (organization_id, card_id);
