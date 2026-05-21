/** Keep in sync with docs/product/DEFAULT_PIPELINE.md and supabase/seed/landscaping_default_columns.sql */
export const LANDSCAPING_DEFAULT_COLUMNS = [
  { name: 'New inquiry', position: 0, stateKey: 'inquiry' },
  { name: 'Site visit', position: 1, stateKey: 'site_visit' },
  { name: 'Estimating', position: 2, stateKey: 'estimating' },
  { name: 'Estimate sent', position: 3, stateKey: 'estimate_sent' },
  { name: 'Approved', position: 4, stateKey: 'approved' },
  { name: 'Scheduled', position: 5, stateKey: 'scheduled' },
  { name: 'On site', position: 6, stateKey: 'on_site' },
  { name: 'Complete', position: 7, stateKey: 'complete' },
  { name: 'Closed', position: 8, stateKey: 'closed' },
] as const;
