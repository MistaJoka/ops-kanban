-- Auto-update updated_at on row changes

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger cards_updated_at before update on cards
  for each row execute function public.set_updated_at();

create trigger customers_updated_at before update on customers
  for each row execute function public.set_updated_at();

create trigger quotes_updated_at before update on quotes
  for each row execute function public.set_updated_at();

create trigger invoices_updated_at before update on invoices
  for each row execute function public.set_updated_at();
