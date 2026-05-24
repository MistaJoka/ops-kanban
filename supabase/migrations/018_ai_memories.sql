-- Org-scoped AI memory (brand voice, no PII)

create table if not exists public.ai_memories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  memory_key text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  unique (organization_id, memory_key)
);

create index if not exists ai_memories_org_idx on public.ai_memories (organization_id);

alter table public.ai_memories enable row level security;

create policy ai_memories_select on public.ai_memories for select
  using (organization_id in (select public.user_organization_ids()));

create policy ai_memories_insert on public.ai_memories for insert
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner', 'manager')
    )
  );

create policy ai_memories_update on public.ai_memories for update
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner', 'manager')
    )
  );

create policy ai_memories_delete on public.ai_memories for delete
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid() and role in ('owner', 'manager')
    )
  );
