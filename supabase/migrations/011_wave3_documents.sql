-- Wave 3: attachments, signatures, envelopes, change orders

alter table cards
  add column if not exists parent_card_id uuid references cards(id) on delete set null;

create index if not exists cards_parent_card_idx on cards (organization_id, parent_card_id);

create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  storage_path text not null,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null default 0 check (size_bytes >= 0),
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists signatures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  quote_id uuid references quotes(id) on delete set null,
  signer_name text,
  signed_at timestamptz not null default now(),
  signer_ip text,
  provider text not null check (provider in ('native', 'docusign')),
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists envelopes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  card_id uuid not null references cards(id) on delete cascade,
  quote_id uuid references quotes(id) on delete set null,
  provider text not null default 'docusign',
  external_id text not null,
  status text not null default 'sent' check (status in ('sent', 'delivered', 'completed', 'declined', 'voided')),
  signing_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, external_id)
);

create index if not exists attachments_card_idx on attachments (organization_id, card_id, created_at desc);
create index if not exists signatures_card_idx on signatures (organization_id, card_id, signed_at desc);
create index if not exists envelopes_card_idx on envelopes (organization_id, card_id, created_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'card-attachments',
  'card-attachments',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'text/plain']
)
on conflict (id) do nothing;
