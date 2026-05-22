-- RLS for Wave 1 integration tables

alter table payments enable row level security;
alter table integration_events enable row level security;
alter table integration_accounts enable row level security;
alter table portal_tokens enable row level security;

create policy payments_org on payments for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy integration_events_org on integration_events for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy integration_accounts_select on integration_accounts for select
  using (organization_id in (select public.user_organization_ids()));

create policy integration_accounts_manage on integration_accounts for all
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ))
  with check (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));

create policy portal_tokens_org on portal_tokens for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));
