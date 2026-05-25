-- Public inquiry intake (web form, QR links, webhook JSON)

create table if not exists inquiry_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  title text not null default 'Request a quote',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id),
  unique (slug)
);

create table if not exists inquiry_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  idempotency_key text not null,
  card_id uuid references cards(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (organization_id, idempotency_key)
);

create index if not exists inquiry_pages_slug_idx on inquiry_pages (slug);

alter table inquiry_pages enable row level security;
alter table inquiry_requests enable row level security;

create policy inquiry_pages_org on inquiry_pages for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy inquiry_requests_org on inquiry_requests for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));
