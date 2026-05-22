-- Native accounting ledger (replaces QuickBooks sync)

create table if not exists accounting_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  entry_type text not null check (entry_type in ('invoice_issued', 'payment_received')),
  amount numeric(12, 2) not null check (amount >= 0),
  customer_id uuid references customers(id) on delete set null,
  card_id uuid references cards(id) on delete set null,
  invoice_id uuid references invoices(id) on delete set null,
  payment_id uuid references payments(id) on delete set null,
  description text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists accounting_transactions_invoice_issued_uq
  on accounting_transactions (organization_id, invoice_id)
  where entry_type = 'invoice_issued' and invoice_id is not null;

create unique index if not exists accounting_transactions_payment_received_uq
  on accounting_transactions (organization_id, invoice_id)
  where entry_type = 'payment_received' and invoice_id is not null;

create index if not exists accounting_transactions_org_occurred_idx
  on accounting_transactions (organization_id, occurred_at desc);

create index if not exists accounting_transactions_org_type_idx
  on accounting_transactions (organization_id, entry_type, occurred_at desc);

-- Backfill invoice_issued from existing non-void invoices
insert into accounting_transactions (
  organization_id,
  entry_type,
  amount,
  customer_id,
  card_id,
  invoice_id,
  description,
  occurred_at
)
select
  i.organization_id,
  'invoice_issued',
  i.total,
  card.customer_id,
  i.card_id,
  i.id,
  coalesce(card.title, 'Invoice') || ' — $' || trim(to_char(i.total, '999999990.00')),
  i.created_at
from invoices i
join cards card on card.id = i.card_id and card.organization_id = i.organization_id
where i.status <> 'void'
on conflict do nothing;

-- Backfill payment_received from paid invoices
insert into accounting_transactions (
  organization_id,
  entry_type,
  amount,
  customer_id,
  card_id,
  invoice_id,
  payment_id,
  description,
  occurred_at
)
select
  i.organization_id,
  'payment_received',
  i.total,
  card.customer_id,
  i.card_id,
  i.id,
  p.id,
  coalesce(card.title, 'Payment') || ' — $' || trim(to_char(i.total, '999999990.00')),
  coalesce(i.updated_at, i.created_at)
from invoices i
join cards card on card.id = i.card_id and card.organization_id = i.organization_id
left join lateral (
  select id from payments
  where invoice_id = i.id and organization_id = i.organization_id and status = 'completed'
  order by created_at desc
  limit 1
) p on true
where i.status = 'paid'
on conflict do nothing;

-- Tighten integration_accounts to active delivery pipes only
alter table integration_accounts drop constraint if exists integration_accounts_provider_check;

alter table integration_accounts add constraint integration_accounts_provider_check
  check (provider in ('stripe', 'paypal', 'twilio', 'resend'));

-- RLS
alter table accounting_transactions enable row level security;

create policy accounting_transactions_select on accounting_transactions for select
  using (organization_id in (select public.user_organization_ids()));

create policy accounting_transactions_manage on accounting_transactions for all
  using (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ))
  with check (organization_id in (
    select organization_id from organization_members where user_id = auth.uid() and role in ('owner', 'manager')
  ));
