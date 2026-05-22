export const COMPACT_STATE_ORDER = [
  'inquiry',
  'site_visit',
  'estimating',
  'estimate_sent',
  'approved',
  'scheduled',
  'on_site',
  'complete',
  'archived',
] as const;

export const FULL_STATE_ORDER = [
  'inquiry',
  'qualified',
  'site_visit',
  'estimating',
  'estimate_sent',
  'negotiation',
  'approved',
  'scheduling',
  'ready',
  'on_site',
  'blocked',
  'walkthrough',
  'complete',
  'invoice_prep',
  'invoice_sent',
  'payment_pending',
  'paid',
  'retention',
  'archived',
] as const;

export type CompactStateKey = (typeof COMPACT_STATE_ORDER)[number];
export type FullStateKey = (typeof FULL_STATE_ORDER)[number];
export type StateKey = CompactStateKey | FullStateKey;

export type ColumnCategory = 'sales' | 'production' | 'billing' | 'aftercare';

export const COLUMN_CATEGORY: Record<string, ColumnCategory> = {
  inquiry: 'sales',
  qualified: 'sales',
  site_visit: 'sales',
  estimating: 'sales',
  estimate_sent: 'sales',
  negotiation: 'sales',
  approved: 'production',
  scheduling: 'production',
  ready: 'production',
  scheduled: 'production',
  on_site: 'production',
  blocked: 'production',
  walkthrough: 'production',
  complete: 'billing',
  invoice_prep: 'billing',
  invoice_sent: 'billing',
  payment_pending: 'billing',
  paid: 'billing',
  retention: 'aftercare',
  archived: 'aftercare',
};

export const CATEGORY_ACCENT: Record<ColumnCategory, string> = {
  sales: 'var(--cat-sales)',
  production: 'var(--cat-production)',
  billing: 'var(--cat-billing)',
  aftercare: 'var(--cat-aftercare)',
};

export function stateKeyIndex(stateKey: string, pipelineMode: 'compact' | 'full' = 'compact'): number {
  const order = pipelineMode === 'full' ? FULL_STATE_ORDER : COMPACT_STATE_ORDER;
  return order.indexOf(stateKey as never);
}

export function isStateKey(value: string, pipelineMode: 'compact' | 'full' = 'compact'): value is StateKey {
  return stateKeyIndex(value, pipelineMode) >= 0;
}
