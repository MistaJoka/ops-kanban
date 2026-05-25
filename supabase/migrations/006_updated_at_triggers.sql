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

drop trigger if exists cards_updated_at on cards;
create trigger cards_updated_at before update on cards
  for each row execute function public.set_updated_at();

drop trigger if exists customers_updated_at on customers;
create trigger customers_updated_at before update on customers
  for each row execute function public.set_updated_at();

drop trigger if exists quotes_updated_at on quotes;
create trigger quotes_updated_at before update on quotes
  for each row execute function public.set_updated_at();

drop trigger if exists invoices_updated_at on invoices;
create trigger invoices_updated_at before update on invoices
  for each row execute function public.set_updated_at();
