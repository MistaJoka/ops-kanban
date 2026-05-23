import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { QuoteView } from '@/lib/domain/money/quotes';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { PaymentView } from '@/lib/domain/integrations/payments';
import type { CardPayload } from '@/components/card/useCardDetail';

export function applyDetailPatch(
  card: CardDetailView,
  patch: Record<string, unknown>,
): CardDetailView {
  const next: CardDetailView = {
    ...card,
    updatedAt: new Date().toISOString(),
  };

  if (patch.title !== undefined) {
    next.title = String(patch.title);
  }
  if (patch.description !== undefined) {
    next.description = patch.description as string | null;
  }
  if (patch.priority !== undefined) {
    next.priority = String(patch.priority);
  }
  if (patch.jobType !== undefined) {
    next.jobType = patch.jobType as string | null;
  }
  if (patch.nextAction !== undefined) {
    next.nextAction = patch.nextAction as string | null;
  }
  if (patch.dueDate !== undefined) {
    next.dueDate = patch.dueDate as string | null;
  }
  if (patch.scheduledStart !== undefined) {
    next.scheduledStart = patch.scheduledStart as string | null;
  }
  if (patch.scheduledEnd !== undefined) {
    next.scheduledEnd = patch.scheduledEnd as string | null;
  }
  if (patch.assignedTo !== undefined) {
    next.assignedTo = patch.assignedTo as string | null;
  }
  if (patch.checklist !== undefined) {
    next.checklist = patch.checklist as CardDetailView['checklist'];
  }

  return next;
}

export function applyMoneyPatch(
  payload: CardPayload,
  patch: {
    quote?: QuoteView | null;
    invoice?: InvoiceView | null;
    payment?: PaymentView | null;
    cardPatch?: Record<string, unknown>;
  },
): CardPayload {
  return {
    ...payload,
    ...(patch.quote !== undefined ? { quote: patch.quote } : {}),
    ...(patch.invoice !== undefined ? { invoice: patch.invoice } : {}),
    ...(patch.payment !== undefined ? { payment: patch.payment } : {}),
    card: patch.cardPatch ? applyDetailPatch(payload.card, patch.cardPatch) : payload.card,
  };
}

export function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
