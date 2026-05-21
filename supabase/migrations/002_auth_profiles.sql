-- Link profiles to Supabase Auth users

alter table profiles
  add constraint profiles_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;
