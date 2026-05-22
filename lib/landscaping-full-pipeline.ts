/** Full 19-column landscaping pipeline — see docs/product/FULL_PIPELINE.md */

export type PipelineGroupKey = 'sales' | 'production' | 'billing' | 'aftercare';

export type FullPipelineColumn = {
  name: string;
  position: number;
  stateKey: string;
  groupKey: PipelineGroupKey;
};

export const LANDSCAPING_FULL_PIPELINE: FullPipelineColumn[] = [
  { name: 'New inquiry', position: 0, stateKey: 'inquiry', groupKey: 'sales' },
  { name: 'Qualified', position: 1, stateKey: 'qualified', groupKey: 'sales' },
  { name: 'Site visit', position: 2, stateKey: 'site_visit', groupKey: 'sales' },
  { name: 'Estimating', position: 3, stateKey: 'estimating', groupKey: 'sales' },
  { name: 'Estimate sent', position: 4, stateKey: 'estimate_sent', groupKey: 'sales' },
  { name: 'Negotiation', position: 5, stateKey: 'negotiation', groupKey: 'sales' },
  { name: 'Approved', position: 6, stateKey: 'approved', groupKey: 'sales' },
  { name: 'Scheduling', position: 7, stateKey: 'scheduling', groupKey: 'production' },
  { name: 'Ready', position: 8, stateKey: 'ready', groupKey: 'production' },
  { name: 'On site', position: 9, stateKey: 'on_site', groupKey: 'production' },
  { name: 'Blocked', position: 10, stateKey: 'blocked', groupKey: 'production' },
  { name: 'Walkthrough', position: 11, stateKey: 'walkthrough', groupKey: 'production' },
  { name: 'Job complete', position: 12, stateKey: 'complete', groupKey: 'billing' },
  { name: 'Invoice prep', position: 13, stateKey: 'invoice_prep', groupKey: 'billing' },
  { name: 'Invoice sent', position: 14, stateKey: 'invoice_sent', groupKey: 'billing' },
  { name: 'Payment pending', position: 15, stateKey: 'payment_pending', groupKey: 'billing' },
  { name: 'Paid', position: 16, stateKey: 'paid', groupKey: 'billing' },
  { name: 'Follow-up', position: 17, stateKey: 'retention', groupKey: 'aftercare' },
  { name: 'Archived', position: 18, stateKey: 'archived', groupKey: 'aftercare' },
] as const;

export const PIPELINE_GROUP_LABELS: Record<PipelineGroupKey, string> = {
  sales: 'Intake & sales',
  production: 'Production',
  billing: 'Billing',
  aftercare: 'Aftercare',
};
