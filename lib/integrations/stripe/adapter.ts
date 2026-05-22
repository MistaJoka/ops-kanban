import 'server-only';

import Stripe from 'stripe';

import type { PaymentAdapter, WebhookEvent } from '@/lib/integrations/types';
import { roundMoney } from '@/lib/domain/money/moneyMath';

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY.');
  }

  return new Stripe(key);
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export const stripePaymentAdapter: PaymentAdapter = {
  async createPaymentLink(params) {
    const stripe = getStripeClient();
    const amountCents = Math.round(roundMoney(params.amount) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      customer_email: params.customerEmail ?? undefined,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: params.currency,
            unit_amount: amountCents,
            product_data: {
              name: 'Landscaping invoice',
              description: `Invoice ${params.invoiceId.slice(0, 8)}`,
            },
          },
        },
      ],
      metadata: {
        organization_id: params.organizationId,
        invoice_id: params.invoiceId,
        card_id: params.cardId,
      },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }

    return {
      url: session.url,
      externalId: session.id,
    };
  },

  async verifyWebhook(request: Request): Promise<WebhookEvent | null> {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
    }

    const signature = request.headers.get('stripe-signature');
    if (!signature) {
      return null;
    }

    const body = await request.text();
    const stripe = getStripeClient();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } catch {
      return null;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organization_id;
      const invoiceId = session.metadata?.invoice_id;
      const cardId = session.metadata?.card_id;
      const amount = session.amount_total ? session.amount_total / 100 : 0;

      if (!organizationId || !invoiceId || !cardId) {
        return null;
      }

      return {
        provider: 'stripe',
        eventType: 'payment.completed',
        externalId: session.id,
        organizationId,
        invoiceId,
        cardId,
        amount: roundMoney(amount),
        currency: session.currency ?? 'usd',
        raw: event,
      };
    }

    if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const organizationId = session.metadata?.organization_id;
      const invoiceId = session.metadata?.invoice_id;
      const cardId = session.metadata?.card_id;

      if (!organizationId || !invoiceId || !cardId) {
        return null;
      }

      return {
        provider: 'stripe',
        eventType: 'payment.failed',
        externalId: session.id,
        organizationId,
        invoiceId,
        cardId,
        amount: 0,
        currency: session.currency ?? 'usd',
        raw: event,
      };
    }

    return null;
  },
};

export function parseStripeWebhookEvent(raw: unknown): WebhookEvent | null {
  const event = raw as Stripe.Event;
  if (event.type !== 'checkout.session.completed') {
    return null;
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const organizationId = session.metadata?.organization_id;
  const invoiceId = session.metadata?.invoice_id;
  const cardId = session.metadata?.card_id;

  if (!organizationId || !invoiceId || !cardId) {
    return null;
  }

  return {
    provider: 'stripe',
    eventType: 'payment.completed',
    externalId: session.id,
    organizationId,
    invoiceId,
    cardId,
    amount: session.amount_total ? roundMoney(session.amount_total / 100) : 0,
    currency: session.currency ?? 'usd',
    raw: event,
  };
}
