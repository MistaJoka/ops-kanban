import type { QuoteView } from '@/lib/domain/money/quotes';
import type { CardDetailView } from '@/lib/domain/cards/cardDetail';

export function buildEstimateHtml(params: {
  card: CardDetailView;
  quote: QuoteView;
  organizationName?: string;
}) {
  const rows = params.quote.items
    .map(
      (item) =>
        `<tr><td>${escapeHtml(item.description)}</td><td>${item.quantity}</td><td>$${item.unitPrice.toFixed(2)}</td><td>$${(item.quantity * item.unitPrice).toFixed(2)}</td></tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Estimate — ${escapeHtml(params.card.title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #1a1f16; padding: 32px; }
    h1 { margin-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border-bottom: 1px solid #e2ddd4; padding: 8px; text-align: left; }
    .total { margin-top: 16px; font-size: 1.25rem; font-weight: 700; }
  </style>
</head>
<body>
  <h1>${escapeHtml(params.card.title)}</h1>
  <p>${escapeHtml(params.organizationName ?? 'OpsBoard')}</p>
  <p>${escapeHtml(params.card.customer?.address ?? params.card.customer?.name ?? 'Property TBD')}</p>
  <table>
    <thead><tr><th>Description</th><th>Qty</th><th>Unit</th><th>Line total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">Total: $${params.quote.total.toFixed(2)}</p>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
