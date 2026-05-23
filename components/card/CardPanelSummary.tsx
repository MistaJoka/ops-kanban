'use client';

import { CircleDollarSign, UserRound } from 'lucide-react';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import { computeMoneyBadge } from '@/lib/domain/cards/cardSignals';
import {
  formatMoneyCompact,
  getAssigneeInitials,
  isDueSoon,
} from '@/lib/domain/cards/boardCardFormatters';
import {
  CardAssigneeChip,
  CardDueSignal,
  CardMoneySignal,
  CardScheduleSignal,
} from '@/components/pipeline/board-card-primitives';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { QuoteView } from '@/lib/domain/money/quotes';
import { cn } from '@/lib/utils';

export function CardPanelSummary({
  card,
  quote,
  invoice,
}: {
  card: CardDetailView;
  quote: QuoteView | null;
  invoice: InvoiceView | null;
}) {
  const moneyBadge = computeMoneyBadge(
    quote ? [{ status: quote.status, total: quote.total }] : null,
    invoice ? [{ status: invoice.status, balance_due: invoice.balanceDue }] : null,
  );
  const quoteTotal = quote?.total ?? card.quoteTotal ?? 0;
  const balanceDue = invoice?.balanceDue ?? 0;
  const initials = getAssigneeInitials(card.assigneeName);
  const isOverdue = Boolean(
    card.dueDate && new Date(card.dueDate).getTime() < Date.now() && card.stateKey !== 'archived',
  );
  const showDue =
    card.dueDate && (isOverdue || isDueSoon(card.dueDate));
  const hasMoney = moneyBadge !== 'none';
  const hasSchedule = Boolean(card.scheduledStart);
  const hasAssignee = Boolean(initials);

  if (!hasMoney && !hasSchedule && !showDue && !hasAssignee) {
    return null;
  }

  return (
    <div className="ops-panel-summary">
      <div className="ops-panel-summary__primary">
        {hasMoney ? (
          <CardMoneySignal badge={moneyBadge} quoteTotal={quoteTotal} balanceDue={balanceDue} />
        ) : card.revenueValue > 0 ? (
          <span className="ops-board-card__signal ops-board-card__signal--money ops-board-card__signal--sales">
            <CircleDollarSign className="ops-board-card__signal-icon" strokeWidth={2.25} aria-hidden />
            <span className="tabular-nums">{formatMoneyCompact(card.revenueValue)}</span>
          </span>
        ) : null}
        {showDue && card.dueDate ? (
          <CardDueSignal dueDate={card.dueDate} isOverdue={isOverdue} />
        ) : null}
        {hasSchedule && card.scheduledStart ? (
          <CardScheduleSignal scheduledStart={card.scheduledStart} />
        ) : null}
        {!hasMoney && !hasSchedule && !showDue ? (
          <span className="ops-panel-summary__placeholder">Add schedule or estimate in tabs below</span>
        ) : null}
      </div>
      {hasAssignee ? (
        <CardAssigneeChip initials={initials!} name={card.assigneeName} />
      ) : (
        <span className="ops-panel-summary__unassigned">
          <UserRound className="size-3 opacity-70" strokeWidth={2.25} aria-hidden />
          Unassigned
        </span>
      )}
    </div>
  );
}
