import { parseEstimateLineItems } from '@/lib/ai/estimate-parser';
import { createCardComment } from '@/lib/domain/comments/cardComments';
import { createInvoicePaymentLink } from '@/lib/domain/integrations/payments';
import {
  createInvoiceDraft,
  getInvoiceForCard,
  markInvoicePaid,
} from '@/lib/domain/money/invoices';
import { getQuoteForCard, upsertQuoteDraft } from '@/lib/domain/money/quotes';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';

import { appOrigin, type ToolHandler } from './toolHelpers';

export const moneyToolHandlers: Record<string, ToolHandler> = {
  createQuoteDraft: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId, role } = ctx;
    const cardId = String(input.cardId);
    const detail = await getCardDetail(client, organizationId, cardId);
    if (!detail) {
      throw new Error('Card not found.');
    }

    let lineItems: Array<{ description: string; quantity: number; unitPrice: number }>;

    if (Array.isArray(input.lineItems) && input.lineItems.length > 0) {
      lineItems = (input.lineItems as Array<Record<string, unknown>>).map((item) => ({
        description: String(item.description),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }));
    } else {
      const scopeNotes =
        (input.scopeNotes ? String(input.scopeNotes) : '') || detail.description || detail.title;

      const parsed = await parseEstimateLineItems({
        scopeNotes,
        jobTitle: detail.title,
        revenueHint: detail.revenueValue ?? undefined,
      });
      lineItems = parsed.lineItems;

      if (parsed.assumptions.length) {
        await createCardComment(client, {
          organizationId,
          cardId,
          authorId: userId,
          role,
          body: `Estimate assumptions: ${parsed.assumptions.join('; ')}`,
        });
      }
    }

    const quote = await upsertQuoteDraft(client, organizationId, cardId, userId, lineItems);

    return {
      message: `Saved estimate draft ($${quote.total.toFixed(2)}). Review line items in the Estimate tab.`,
      data: quote,
      cardId,
    };
  },

  createInvoiceDraft: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId } = ctx;
    const cardId = String(input.cardId);
    const quote = await getQuoteForCard(client, organizationId, cardId);
    const invoice = await createInvoiceDraft(client, organizationId, cardId, userId, quote?.id);

    return {
      message: `Invoice draft created ($${invoice.total.toFixed(2)}).`,
      data: invoice,
      cardId,
    };
  },

  createPaymentLink: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId } = ctx;
    const cardId = String(input.cardId);
    const invoice = await getInvoiceForCard(client, organizationId, cardId);
    if (!invoice) {
      throw new Error('Create an invoice draft before generating a payment link.');
    }

    const origin = appOrigin();
    const payment = await createInvoicePaymentLink(client, organizationId, invoice.id, userId, {
      successUrl: `${origin}/pipeline?payment=success`,
      cancelUrl: `${origin}/pipeline?payment=cancelled`,
    });

    return {
      message: payment.paymentUrl
        ? `Payment link ready: ${payment.paymentUrl}`
        : 'Payment link created.',
      data: payment,
      cardId,
    };
  },

  markInvoicePaid: async (input, ctx, _boardCtx) => {
    const { client, organizationId, userId, role } = ctx;
    const cardId = String(input.cardId);
    const invoice = await getInvoiceForCard(client, organizationId, cardId);
    if (!invoice) {
      throw new Error('No invoice found for this job.');
    }

    const paid = await markInvoicePaid(
      client,
      organizationId,
      invoice.id,
      userId,
      role,
      input.method ? String(input.method) : 'manual',
    );

    return {
      message: `Invoice marked paid ($${paid.total.toFixed(2)}).`,
      data: paid,
      cardId,
    };
  },
};
