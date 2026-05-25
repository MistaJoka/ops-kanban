export type PanelTabKey =
  | 'overview'
  | 'property'
  | 'scope'
  | 'schedule'
  | 'comments'
  | 'checklist'
  | 'estimate'
  | 'money'
  | 'comms'
  | 'files';

export function defaultPanelTabForState(stateKey: string): PanelTabKey {
  if (stateKey === 'estimating' || stateKey === 'estimate_sent') {
    return 'estimate';
  }

  if (stateKey === 'scheduled' || stateKey === 'on_site' || stateKey === 'approved') {
    return 'schedule';
  }

  if (
    stateKey === 'complete' ||
    stateKey.startsWith('invoice_') ||
    stateKey === 'payment_pending' ||
    stateKey === 'paid'
  ) {
    return 'money';
  }

  return 'overview';
}
