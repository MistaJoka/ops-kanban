-- RLS policies — org scoped via organization_members

-- Helper: current user org ids
create or replace function public.user_organization_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from organization_members where user_id = auth.uid();
$$;

-- Enable RLS
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table organization_members enable row level security;
alter table boards enable row level security;
alter table columns enable row level security;
alter table customers enable row level security;
alter table cards enable row level security;
alter table activities enable row level security;
alter table comments enable row level security;
alter table quotes enable row level security;
alter table quote_items enable row level security;
alter table invoices enable row level security;
alter table ai_tool_calls enable row level security;
alter table ai_action_approvals enable row level security;

-- organizations
create policy org_select on organizations for select
  using (id in (select public.user_organization_ids()));
create policy org_update on organizations for update
  using (id in (select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')));

-- profiles
create policy profiles_select_own on profiles for select
  using (id = auth.uid() or id in (
    select om2.user_id from organization_members om1
    join organization_members om2 on om2.organization_id = om1.organization_id
    where om1.user_id = auth.uid()
  ));
create policy profiles_update_own on profiles for update
  using (id = auth.uid());
create policy profiles_insert_own on profiles for insert
  with check (id = auth.uid());

-- organization_members
create policy members_select on organization_members for select
  using (organization_id in (select public.user_organization_ids()));
create policy members_insert on organization_members for insert
  with check (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));
create policy members_update on organization_members for update
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));
create policy members_delete on organization_members for delete
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role = 'owner'
  ));

-- org-scoped tables (standard pattern)
create policy boards_org on boards for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy columns_org on columns for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy customers_org on customers for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy cards_select on cards for select
  using (organization_id in (select public.user_organization_ids()));
create policy cards_insert on cards for insert
  with check (organization_id in (select public.user_organization_ids()));
create policy cards_update on cards for update
  using (organization_id in (select public.user_organization_ids()));
create policy cards_delete on cards for delete
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));

create policy activities_org on activities for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy comments_org on comments for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy quotes_org on quotes for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy quote_items_org on quote_items for all
  using (exists (
    select 1 from quotes q
    where q.id = quote_items.quote_id
      and q.organization_id in (select public.user_organization_ids())
  ))
  with check (exists (
    select 1 from quotes q
    where q.id = quote_items.quote_id
      and q.organization_id in (select public.user_organization_ids())
  ));

create policy invoices_org on invoices for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy ai_tool_calls_org on ai_tool_calls for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy ai_approvals_org on ai_action_approvals for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));
