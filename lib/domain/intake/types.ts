export type IntakeChannel = 'web' | 'sms' | 'webhook';

export type IntakeInput = {
  organizationId: string;
  channel: IntakeChannel;
  source: string;
  campaign?: string | null;
  externalId?: string | null;
  idempotencyKey?: string | null;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  customerAddress?: string | null;
  message: string;
  raw?: unknown;
};

export type ProcessIntakeResult = {
  cardId: string;
  created: boolean;
  attached: boolean;
  idempotent: boolean;
};
