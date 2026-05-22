export type AutomationTriggerType = 'column_enter' | 'invoice_paid';

export type AutomationActionType =
  | 'log_activity'
  | 'set_next_action'
  | 'send_sms_template'
  | 'send_review_request';

export type AutomationView = {
  id: string;
  name: string;
  triggerType: AutomationTriggerType;
  triggerStateKey: string | null;
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
  active: boolean;
  createdAt: string;
};

export type CreateAutomationInput = {
  organizationId: string;
  name: string;
  triggerType: AutomationTriggerType;
  triggerStateKey?: string | null;
  actionType: AutomationActionType;
  actionConfig: Record<string, unknown>;
};
