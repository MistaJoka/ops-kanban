export const BOARD_CARD_SELECT = `
  id, title, column_id, priority, job_type, position, due_date,
  scheduled_start, next_action, updated_at, column_entered_at, customer_id,
  assigned_to, archived_at,
  columns!inner(state_key),
  customers(name, address),
  profiles:assigned_to(full_name),
  quotes(status, total, quote_items(id)),
  invoices(status, balance_due)
`;
