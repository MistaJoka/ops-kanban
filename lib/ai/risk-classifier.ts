export type RiskLevel = 'low' | 'medium' | 'high';

const MEDIUM_RISK_TOOLS = new Set([
  'createCard',
  'moveCard',
  'updateCard',
  'assignCard',
  'createScheduleEvent',
  'rescheduleEvent',
  'createQuoteDraft',
  'updateCustomer',
  'createInvoiceDraft',
  'createCustomer',
]);

const HIGH_RISK_TOOLS = new Set([
  'sendInvoice',
  'sendEmail',
  'sendSms',
  'markInvoicePaid',
  'archiveCard',
  'deleteCard',
  'bulkUpdateCards',
  'updateAutomationRule',
  'createPaymentLink',
]);

export function classifyToolRisk(toolName: string): RiskLevel {
  if (HIGH_RISK_TOOLS.has(toolName)) return 'high';
  if (MEDIUM_RISK_TOOLS.has(toolName)) return 'medium';
  return 'low';
}

export function requiresApproval(riskLevel: RiskLevel): boolean {
  return riskLevel === 'medium' || riskLevel === 'high';
}
