-- Track when a card entered its current column (stage age)

alter table cards
  add column if not exists column_entered_at timestamptz not null default now();

update cards
set column_entered_at = coalesce(updated_at, created_at, now())
where column_entered_at is null;

create index if not exists cards_org_column_entered_idx
  on cards (organization_id, column_id, column_entered_at);
