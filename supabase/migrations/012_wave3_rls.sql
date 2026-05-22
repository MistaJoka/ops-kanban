-- RLS for Wave 3 document tables + storage policies

alter table attachments enable row level security;
alter table signatures enable row level security;
alter table envelopes enable row level security;

create policy attachments_org on attachments for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy signatures_org on signatures for all
  using (organization_id in (select public.user_organization_ids()))
  with check (organization_id in (select public.user_organization_ids()));

create policy envelopes_select on envelopes for select
  using (organization_id in (select public.user_organization_ids()));

create policy envelopes_manage on envelopes for all
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ))
  with check (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));

create policy card_attachments_select on storage.objects for select
  using (
    bucket_id = 'card-attachments'
    and (storage.foldername(name))[1] in (
      select organization_id::text from organization_members where user_id = auth.uid()
    )
  );

create policy card_attachments_insert on storage.objects for insert
  with check (
    bucket_id = 'card-attachments'
    and (storage.foldername(name))[1] in (
      select organization_id::text from organization_members where user_id = auth.uid()
    )
  );

create policy card_attachments_delete on storage.objects for delete
  using (
    bucket_id = 'card-attachments'
    and (storage.foldername(name))[1] in (
      select organization_id::text from organization_members where user_id = auth.uid()
    )
  );
