-- Core MVP schema starter
-- Review and adapt before production deployment.

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key,
  email text,
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('owner','manager','worker','viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists boards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null default 'Operations Board',
  is_primary boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists columns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  board_id uuid not null references boards(id) on delete cascade,
  name text not null,
  position numeric not null default 0,
  state_key text not null,
  created_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text,
  email text,
  address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  board_id uuid not null references boards(id) on delete cascade,
  column_id uuid not null references columns(id),
  customer_id uuid references customers(id) on delete set null,
  title text not null,
  description text,
  priority text check (priority in ('low','medium','high','urgent')) default 'medium',
  assigned_to uuid references profiles(id) on delete set null,
  revenue_value numeric default 0,
  estimated_cost numeric default 0,
  estimated_profit numeric default 0,
  risk_score numeric default 0,
  customer_health text,
  next_action text,
  due_date timestamptz,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  position numeric not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  actor_id uuid references profiles(id) on delete set null,
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  summary text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  status text not null default 'draft',
  subtotal numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references quotes(id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  status text not null default 'draft',
  total numeric not null default 0,
  balance_due numeric not null default 0,
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists ai_tool_calls (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid references profiles(id) on delete set null,
  card_id uuid references cards(id) on delete set null,
  customer_id uuid references customers(id) on delete set null,
  tool_name text not null,
  risk_level text not null check (risk_level in ('low','medium','high')),
  input_json jsonb not null default '{}',
  output_json jsonb not null default '{}',
  status text not null default 'pending',
  approval_status text not null default 'not_required',
  error_message text,
  created_at timestamptz not null default now(),
  executed_at timestamptz
);

create table if not exists ai_action_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  tool_call_id uuid not null references ai_tool_calls(id) on delete cascade,
  requested_by uuid references profiles(id) on delete set null,
  approved_by uuid references profiles(id) on delete set null,
  status text not null default 'pending',
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
