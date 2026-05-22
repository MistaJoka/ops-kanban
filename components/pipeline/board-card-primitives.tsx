import { CalendarDays, CircleDollarSign, GripVertical } from 'lucide-react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { ColumnCategory } from '@/lib/domain/pipeline/types';
import { CATEGORY_ACCENT } from '@/lib/domain/pipeline/types';
import { cn } from '@/lib/utils';

export const MONEY_LABEL: Record<BoardCardView['moneyBadge'], string | null> = {
  none: null,
  estimate_draft: 'Est. draft',
  estimate_sent: 'Sent',
  invoice_draft: 'Invoice',
  balance_due: 'Balance due',
  paid: 'Paid',
};

const MONEY_SIGNAL_CLASS: Record<Exclude<BoardCardView['moneyBadge'], 'none'>, string> = {
  estimate_draft: 'ops-board-card__signal--sales',
  estimate_sent: 'ops-board-card__signal--sales',
  invoice_draft: 'ops-board-card__signal--billing',
  balance_due: 'ops-board-card__signal--urgent',
  paid: 'ops-board-card__signal--paid',
};

export function truncateText(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

export function getCardPropertyLabel(
  customerAddress: string | null | undefined,
  customerName: string | null | undefined,
  jobType: string | null | undefined,
): string | null {
  const property = customerAddress ?? customerName ?? null;
  if (property && jobType) {
    return `${truncateText(property, 32)} · ${jobType}`;
  }
  if (property) {
    return truncateText(property, 32);
  }
  if (jobType) {
    return jobType;
  }
  return null;
}

export function formatPropertyLine(card: BoardCardView): string | null {
  return getCardPropertyLabel(card.customerAddress, card.customerName, card.jobType);
}

export function CardAccentBar({ category }: { category: ColumnCategory }) {
  return (
    <div
      className="ops-board-card__accent"
      style={{ background: CATEGORY_ACCENT[category] }}
      aria-hidden
    />
  );
}

export function CardDragGrip() {
  return <GripVertical className="ops-board-card__grip size-3" strokeWidth={2} aria-hidden />;
}

export function CardPriorityBadge({ priority }: { priority: string }) {
  if (priority !== 'urgent' && priority !== 'high') {
    return null;
  }

  return (
    <span
      className={cn(
        'ops-board-card__priority',
        priority === 'urgent' ? 'ops-board-card__priority--urgent' : 'ops-board-card__priority--high',
      )}
    >
      {priority}
    </span>
  );
}

export function CardMoneySignal({ badge }: { badge: BoardCardView['moneyBadge'] }) {
  const label = MONEY_LABEL[badge];
  if (!label || badge === 'none') {
    return null;
  }

  return (
    <span className={cn('ops-board-card__signal', MONEY_SIGNAL_CLASS[badge])}>
      <CircleDollarSign className="ops-board-card__signal-icon" strokeWidth={2.25} />
      {label}
    </span>
  );
}

export function CardScheduleSignal({ scheduledStart }: { scheduledStart: string }) {
  return (
    <span className="ops-board-card__signal ops-board-card__signal--neutral">
      <CalendarDays className="ops-board-card__signal-icon" strokeWidth={2.25} />
      {new Date(scheduledStart).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })}
    </span>
  );
}

export function CardSignalsRow({ card }: { card: BoardCardView }) {
  const hasMoney = card.moneyBadge !== 'none';
  const hasSchedule = Boolean(card.scheduledStart);

  if (!hasMoney && !hasSchedule) {
    return null;
  }

  return (
    <div className="ops-board-card__signals">
      {hasMoney ? <CardMoneySignal badge={card.moneyBadge} /> : null}
      {hasSchedule && card.scheduledStart ? (
        <CardScheduleSignal scheduledStart={card.scheduledStart} />
      ) : null}
    </div>
  );
}

export function CardFooter({
  nextAction,
  daysInColumn,
  isOverdue,
}: {
  nextAction: string | null;
  daysInColumn: number;
  isOverdue: boolean;
}) {
  const next = nextAction ? truncateText(nextAction, 38) : null;

  return (
    <footer className="ops-board-card__footer">
      {next ? (
        <p className="ops-board-card__next" title={nextAction ?? undefined}>
          <span className="text-[var(--text-tertiary)]">Next · </span>
          {next}
        </p>
      ) : null}
      <span className={cn('ops-board-card__stage', !next && 'ml-auto')}>
        {isOverdue ? <span className="text-[var(--overdue)]">Overdue · </span> : null}
        {daysInColumn}d in stage
      </span>
    </footer>
  );
}
