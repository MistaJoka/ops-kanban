import { NextResponse } from 'next/server';

import { jsonError } from '@/lib/api/response';
import { withApiRoute } from '@/lib/api/withApiRoute';
import { getCardDetail } from '@/lib/domain/cards/cardDetail';
import { buildEstimateHtml } from '@/lib/domain/money/estimateExport';
import { getQuoteForCard } from '@/lib/domain/money/quotes';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  return withApiRoute(
    _request,
    async (context) => {
      const { id } = await params;

      try {
        const [card, quote] = await Promise.all([
          getCardDetail(context.client, context.organizationId, id),
          getQuoteForCard(context.client, context.organizationId, id),
        ]);

        if (!card || !quote) {
          return jsonError('Estimate not found.', 404, 'NOT_FOUND');
        }

        const html = buildEstimateHtml({ card, quote });
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Content-Disposition': `inline; filename="estimate-${id.slice(0, 8)}.html"`,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Export failed.';
        return jsonError(message, 500);
      }
    },
    { route: '/api/cards/[id]/quotes/export' },
  );
}
