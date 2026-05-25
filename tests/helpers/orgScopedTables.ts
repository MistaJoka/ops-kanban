/** Org-scoped tables covered by SEC-RLS matrix tests. Keep in sync with migrations + RLS policies. */
export const BASE_ORG_SCOPED_TABLES = [
  'boards',
  'columns',
  'cards',
  'customers',
  'quotes',
  'invoices',
  'comments',
  'activities',
  'ai_tool_calls',
  'ai_action_approvals',
] as const;

export const WAVE1_ORG_SCOPED_TABLES = [
  'payments',
  'integration_events',
  'integration_accounts',
  'portal_tokens',
] as const;

export const WAVE2_ORG_SCOPED_TABLES = [
  'booking_pages',
  'booking_requests',
  'inquiry_pages',
  'inquiry_requests',
  'schedule_events',
  'message_templates',
  'messages',
] as const;

export const WAVE3_ORG_SCOPED_TABLES = ['attachments', 'signatures', 'envelopes'] as const;

export const WAVE4_ORG_SCOPED_TABLES = [
  'automations',
  'automation_runs',
  'accounting_sync_log',
  'contracts',
] as const;

export const NATIVE_ACCOUNTING_ORG_SCOPED_TABLES = ['accounting_transactions'] as const;

export const POLISH_ORG_SCOPED_TABLES = ['ai_memories', 'client_mutations'] as const;

export const ALL_ORG_SCOPED_TABLES = [
  ...BASE_ORG_SCOPED_TABLES,
  ...WAVE1_ORG_SCOPED_TABLES,
  ...WAVE2_ORG_SCOPED_TABLES,
  ...WAVE3_ORG_SCOPED_TABLES,
  ...WAVE4_ORG_SCOPED_TABLES,
  ...NATIVE_ACCOUNTING_ORG_SCOPED_TABLES,
  ...POLISH_ORG_SCOPED_TABLES,
] as const;

export type OrgScopedTable = (typeof ALL_ORG_SCOPED_TABLES)[number];
