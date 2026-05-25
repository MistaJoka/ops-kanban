import 'server-only';

import type { PaymentAdapter, PaymentWebhookEvent } from '@/lib/integrations/types';
import { roundMoney } from '@/lib/domain/money/moneyMath';

type PayPalAccessToken = { access_token: string; token_type: string };

type PayPalOrder = {
  id: string;
  links?: Array<{ rel: string; href: string }>;
};

type PayPalWebhookPayload = {
  id: string;
  event_type: string;
  resource: Record<string, unknown>;
};

function getPayPalApiBase(): string {
  return process.env.PAYPAL_API_BASE ?? 'https://api-m.sandbox.paypal.com';
}

function getPayPalCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not configured. Set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.');
  }
  return { clientId, clientSecret };
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  const { clientId, clientSecret } = getPayPalCredentials();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const response = await fetch(`${getPayPalApiBase()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    throw new Error('PayPal authentication failed.');
  }

  const payload = (await response.json()) as PayPalAccessToken;
  return payload.access_token;
}

function parseCustomId(customId: unknown): {
  organizationId: string;
  invoiceId: string;
  cardId: string;
} | null {
  if (typeof customId !== 'string' || !customId) {
    return null;
  }

  try {
    const parsed = JSON.parse(customId) as {
      organization_id?: string;
      invoice_id?: string;
      card_id?: string;
    };
    if (!parsed.organization_id || !parsed.invoice_id || !parsed.card_id) {
      return null;
    }
    return {
      organizationId: parsed.organization_id,
      invoiceId: parsed.invoice_id,
      cardId: parsed.card_id,
    };
  } catch {
    return null;
  }
}

function extractMetadataFromResource(
  resource: Record<string, unknown>,
): { organizationId: string; invoiceId: string; cardId: string } | null {
  const direct = parseCustomId(resource.custom_id);
  if (direct) {
    return direct;
  }

  const purchaseUnits = resource.purchase_units;
  if (Array.isArray(purchaseUnits)) {
    for (const unit of purchaseUnits) {
      if (unit && typeof unit === 'object') {
        const fromUnit = parseCustomId((unit as { custom_id?: unknown }).custom_id);
        if (fromUnit) {
          return fromUnit;
        }
      }
    }
  }

  return null;
}

function extractAmountFromResource(resource: Record<string, unknown>): number {
  const amount = resource.amount;
  if (amount && typeof amount === 'object') {
    const value = (amount as { value?: unknown }).value;
    if (typeof value === 'string' || typeof value === 'number') {
      return roundMoney(Number(value));
    }
  }
  return 0;
}

function extractExternalId(resource: Record<string, unknown>, fallbackEventId: string): string {
  if (typeof resource.id === 'string' && resource.id) {
    return resource.id;
  }
  return fallbackEventId;
}

function mapPayPalWebhookEvent(payload: PayPalWebhookPayload): PaymentWebhookEvent | null {
  const metadata = extractMetadataFromResource(payload.resource);
  if (!metadata) {
    return null;
  }

  const currency =
    payload.resource.amount &&
    typeof payload.resource.amount === 'object' &&
    typeof (payload.resource.amount as { currency_code?: unknown }).currency_code === 'string'
      ? ((payload.resource.amount as { currency_code: string }).currency_code.toLowerCase())
      : 'usd';

  if (payload.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    return {
      provider: 'paypal',
      eventType: 'payment.completed',
      externalId: extractExternalId(payload.resource, payload.id),
      organizationId: metadata.organizationId,
      invoiceId: metadata.invoiceId,
      cardId: metadata.cardId,
      amount: extractAmountFromResource(payload.resource),
      currency,
      raw: payload,
    };
  }

  if (
    payload.event_type === 'PAYMENT.CAPTURE.DENIED' ||
    payload.event_type === 'CHECKOUT.ORDER.VOIDED'
  ) {
    return {
      provider: 'paypal',
      eventType: 'payment.failed',
      externalId: extractExternalId(payload.resource, payload.id),
      organizationId: metadata.organizationId,
      invoiceId: metadata.invoiceId,
      cardId: metadata.cardId,
      amount: 0,
      currency,
      raw: payload,
    };
  }

  return null;
}

async function verifyPayPalWebhookSignature(
  request: Request,
  body: string,
  webhookEvent: PayPalWebhookPayload,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    throw new Error('PAYPAL_WEBHOOK_ID is not configured.');
  }

  const transmissionId = request.headers.get('paypal-transmission-id');
  const transmissionTime = request.headers.get('paypal-transmission-time');
  const transmissionSig = request.headers.get('paypal-transmission-sig');
  const certUrl = request.headers.get('paypal-cert-url');
  const authAlgo = request.headers.get('paypal-auth-algo');

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    return false;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${getPayPalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { verification_status?: string };
  return result.verification_status === 'SUCCESS';
}

export const paypalPaymentAdapter: PaymentAdapter = {
  async createPaymentLink(params) {
    const accessToken = await getAccessToken();
    const amount = roundMoney(params.amount).toFixed(2);
    const customId = JSON.stringify({
      organization_id: params.organizationId,
      invoice_id: params.invoiceId,
      card_id: params.cardId,
    });

    const response = await fetch(`${getPayPalApiBase()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: params.currency.toUpperCase(),
              value: amount,
            },
            custom_id: customId,
            description: `Invoice ${params.invoiceId.slice(0, 8)}`,
          },
        ],
        application_context: {
          brand_name: 'OpsBoard',
          user_action: 'PAY_NOW',
          return_url: params.successUrl,
          cancel_url: params.cancelUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('PayPal did not create a checkout order.');
    }

    const order = (await response.json()) as PayPalOrder;
    const approveLink = order.links?.find((link) => link.rel === 'approve')?.href;
    if (!approveLink) {
      throw new Error('PayPal did not return a checkout URL.');
    }

    return {
      url: approveLink,
      externalId: order.id,
    };
  },

  async verifyWebhook(request: Request): Promise<PaymentWebhookEvent | null> {
    const body = await request.text();
    let payload: PayPalWebhookPayload;

    try {
      payload = JSON.parse(body) as PayPalWebhookPayload;
    } catch {
      return null;
    }

    const verified = await verifyPayPalWebhookSignature(request, body, payload);
    if (!verified) {
      return null;
    }

    return mapPayPalWebhookEvent(payload);
  },
};

export function parsePayPalWebhookEvent(raw: unknown): PaymentWebhookEvent | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  return mapPayPalWebhookEvent(raw as PayPalWebhookPayload);
}
