-- RLS for Wave 2 tables

alter table booking_pages enable row level security;
alter table booking_requests enable row level security;
alter table schedule_events enable row level security;
alter table message_templates enable row level security;
alter table messages enable row level security;

create policy booking_pages_org on booking_pages for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy booking_requests_org on booking_requests for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy schedule_events_org on schedule_events for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy message_templates_select on message_templates for select
  using (organization_id in (select public.user_organization_ids()));

create policy message_templates_manage on message_templates for all
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ))
  with check (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));

create policy messages_org on messages for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));
