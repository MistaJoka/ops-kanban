-- Client mutation idempotency for outbound sync retries (REL-003)

create table if not exists public.client_mutations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_mutation_id text not null,
  card_id uuid references public.cards (id) on delete set null,
  response jsonb not null,
  http_status smallint not null default 200,
  created_at timestamptz not null default now(),
  unique (organization_id, client_mutation_id)
);

create index if not exists client_mutations_org_idx on public.client_mutations (organization_id);

alter table public.client_mutations enable row level security;

create policy client_mutations_select on public.client_mutations for select
  using (organization_id in (select public.user_organization_ids()));

create policy client_mutations_insert on public.client_mutations for insert
  with check (organization_id in (select public.user_organization_ids()));
