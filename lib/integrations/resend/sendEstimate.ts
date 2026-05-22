import 'server-only';

import { logActivity } from '@/lib/domain/activities/logActivity';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { buildEstimateHtml } from '@/lib/domain/money/estimateExport';
import { getQuoteForCard } from '@/lib/domain/money/quotes';
import { createPortalToken } from '@/lib/domain/integrations/portalTokens';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function sendEstimateEmail(
  client: SupabaseClient,
  params: {
    organizationId: string;
    cardId: string;
    actorId: string | null;
    toEmail: string;
    baseUrl: string;
  },
) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Resend is not configured. Set RESEND_API_KEY.');
  }

  const [card, quote] = await Promise.all([
    getCardDetail(client, params.organizationId, params.cardId),
    getQuoteForCard(client, params.organizationId, params.cardId),
  ]);

  if (!card || !quote || quote.total <= 0) {
    throw new Error('Save an estimate with line items before sending.');
  }

  const portal = await createPortalToken(client, {
    organizationId: params.organizationId,
    cardId: params.cardId,
    baseUrl: params.baseUrl,
    scopes: ['view_estimate', 'approve', 'pay', 'view_schedule'],
  });

  const html = buildEstimateHtml({ card, quote });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? 'OpsBoard <onboarding@resend.dev>',
      to: [params.toEmail],
      subject: `Estimate: ${card.title}`,
      html: `${html}<p><a href="${portal.portalUrl}">Review and approve online</a></p>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend failed: ${detail}`);
  }

  await logActivity(client, {
    organizationId: params.organizationId,
    actorId: params.actorId,
    entityType: 'quote',
    entityId: quote.id,
    action: 'quote.sent_email',
    summary: `Estimate emailed to ${params.toEmail}`,
    metadata: { portal_url: portal.portalUrl },
  });

  return { portalUrl: portal.portalUrl };
}
