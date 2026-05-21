-- Performance indexes for MVP queries

create index if not exists cards_org_board_column_idx
  on cards (organization_id, board_id, column_id);

create index if not exists cards_org_active_idx
  on cards (organization_id, archived_at)
  where archived_at is null;

create index if not exists activities_org_entity_idx
  on activities (organization_id, entity_type, entity_id, created_at desc);

create index if not exists customers_org_name_idx
  on customers (organization_id, name);

create index if not exists cards_org_scheduled_start_idx
  on cards (organization_id, scheduled_start)
  where archived_at is null;

create index if not exists columns_board_position_idx
  on columns (board_id, position);
