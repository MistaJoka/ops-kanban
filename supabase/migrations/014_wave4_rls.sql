-- RLS for Wave 4 scale tables

alter table automations enable row level security;
alter table automation_runs enable row level security;
alter table accounting_sync_log enable row level security;
alter table contracts enable row level security;

create policy automations_org on automations for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy automation_runs_org on automation_runs for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy accounting_sync_log_select on accounting_sync_log for select
  using (organization_id in (select public.user_organization_ids()));

create policy accounting_sync_log_manage on accounting_sync_log for all
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ))
  with check (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));

create policy contracts_org on contracts for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));
