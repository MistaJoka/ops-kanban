-- Wave 4: automations, accounting sync, recurring contracts

create table if not exists automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in ('column_enter', 'invoice_paid')),
  trigger_state_key text,
  action_type text not null check (action_type in ('log_activity', 'set_next_action')),
  action_config jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  automation_id uuid not null references automations(id) on delete cascade,
  card_id uuid references cards(id) on delete set null,
  status text not null check (status in ('completed', 'failed', 'skipped')),
  error_message text,
  created_at timestamptz not null default now()
);

create table if not exists accounting_sync_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entity_type text not null check (entity_type in ('customer', 'invoice', 'payment')),
  entity_id uuid not null,
  provider text not null default 'quickbooks',
  external_id text,
  status text not null check (status in ('pending', 'synced', 'failed')),
  error_message text,
  payload_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, entity_type, entity_id)
);

create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  title text not null,
  job_type text,
  frequency text not null check (frequency in ('weekly', 'biweekly', 'monthly', 'seasonal')),
  next_run_at timestamptz not null,
  amount numeric(12, 2),
  active boolean not null default true,
  last_card_id uuid references cards(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists automations_org_idx on automations (organization_id, active, trigger_type);
create index if not exists automation_runs_automation_idx on automation_runs (organization_id, automation_id, created_at desc);
create index if not exists accounting_sync_log_entity_idx on accounting_sync_log (organization_id, entity_type, entity_id);
create index if not exists contracts_org_idx on contracts (organization_id, active, next_run_at);
