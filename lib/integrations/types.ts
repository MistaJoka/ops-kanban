export type IntegrationProvider = 'paypal' | 'stripe' | 'twilio' | 'resend';

export type PaymentWebhookEvent = {
  provider: 'paypal' | 'stripe';
  eventType: string;
  externalId: string;
  organizationId: string;
  invoiceId: string;
  cardId: string;
  amount: number;
  currency: string;
  raw: unknown;
};

/** @deprecated Use PaymentWebhookEvent */
export type WebhookEvent = PaymentWebhookEvent;

export type CommsWebhookEvent = {
  provider: 'twilio';
  eventType: 'sms.received';
  externalId: string;
  organizationId: string;
  fromPhone: string;
  toPhone: string;
  body: string;
  raw: unknown;
};

export type PaymentLinkResult = {
  url: string;
  externalId: string;
};

export interface PaymentAdapter {
  createPaymentLink(params: {
    invoiceId: string;
    cardId: string;
    organizationId: string;
    amount: number;
    currency: string;
    customerEmail?: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<PaymentLinkResult>;
  verifyWebhook(request: Request): Promise<PaymentWebhookEvent | null>;
}

export interface CommsAdapter {
  sendSms(params: { to: string; body: string }): Promise<{ externalId: string }>;
  verifyWebhook(request: Request, url: string): Promise<CommsWebhookEvent | null>;
}
