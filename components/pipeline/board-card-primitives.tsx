import type { ReactNode } from 'react';
import { CalendarDays, CircleDollarSign, Clock3, GripVertical, MapPin } from 'lucide-react';

import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type { MoneyBadge } from '@/lib/domain/cards/cardSignals';
import {
  formatBoardCardPropertyLine,
  formatDueLabel,
  formatMoneyCompact,
  formatScheduleLabel,
  isDueSoon,
  truncateText,
} from '@/lib/domain/cards/boardCardFormatters';
import type { ColumnCategory } from '@/lib/domain/pipeline/types';
import { CATEGORY_ACCENT } from '@/lib/domain/pipeline/types';
import { cn } from '@/lib/utils';

export {
  formatMoneyCompact,
  formatScheduleLabel,
  getAssigneeInitials,
  truncateText,
} from '@/lib/domain/cards/boardCardFormatters';

export { formatBoardCardPropertyLine } from '@/lib/domain/cards/boardCardFormatters';

export const MONEY_LABEL: Record<MoneyBadge, string | null> = {
  none: null,
  estimate_draft: 'est.',
  estimate_sent: 'sent',
  invoice_draft: 'invoice',
  balance_due: 'due',
  paid: 'Paid',
};

const MONEY_SIGNAL_CLASS: Record<Exclude<MoneyBadge, 'none'>, string> = {
  estimate_draft: 'ops-board-card__signal--sales',
  estimate_sent: 'ops-board-card__signal--sales',
  invoice_draft: 'ops-board-card__signal--billing',
  balance_due: 'ops-board-card__signal--urgent',
  paid: 'ops-board-card__signal--paid',
};

const JOB_TYPE_CHIP_LABEL: Record<string, string> = {
  maintenance: 'Maint.',
  install: 'Install',
  hardscape: 'Hardscape',
  cleanup: 'Cleanup',
  irrigation: 'Irrig.',
  other: 'Other',
};

/** Board scan line: address · job type (CARD_DESIGN.md). */
export function formatPropertyLine(card: BoardCardView): string | null {
  return formatBoardCardPropertyLine(card.customerAddress, card.customerName, card.jobType, 38);
}

export function getCardPropertyLabel(
  customerAddress: string | null | undefined,
  customerName: string | null | undefined,
  jobType: string | null | undefined,
): string | null {
  return formatBoardCardPropertyLine(customerAddress, customerName, jobType);
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
  return <GripVertical className="ops-board-card__grip size-3.5" strokeWidth={2} aria-hidden />;
}

export function CardStatusDot({
  variant,
  label,
}: {
  variant: 'unassigned' | 'overdue';
  label: string;
}) {
  return (
    <span
      className={cn(
        'ops-board-card__status-dot',
        variant === 'overdue' && 'ops-board-card__status-dot--overdue',
        variant === 'unassigned' && 'ops-board-card__status-dot--unassigned',
      )}
      title={label}
      aria-label={label}
    />
  );
}

export function CardHeaderStatus({ card }: { card: BoardCardView }) {
  const showUnassigned = !card.assigneeInitials && card.stateKey !== 'archived';

  if (!showUnassigned && !card.isOverdue) {
    return null;
  }

  return (
    <div className="ops-board-card__status">
      {card.isOverdue ? <CardStatusDot variant="overdue" label="Overdue" /> : null}
      {showUnassigned ? <CardStatusDot variant="unassigned" label="Unassigned" /> : null}
    </div>
  );
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

export function CardJobTypeChip({ jobType }: { jobType: string }) {
  const label = JOB_TYPE_CHIP_LABEL[jobType] ?? truncateText(jobType, 10);

  return (
    <span className="ops-board-card__chip ops-board-card__chip--job" title={jobType}>
      {label}
    </span>
  );
}

export function CardAssigneeChip({
  initials,
  name,
}: {
  initials: string;
  name?: string | null;
}) {
  return (
    <span
      className="ops-board-card__chip ops-board-card__chip--assignee"
      title={name ?? initials}
      aria-label={name ? `Assigned to ${name}` : `Assignee ${initials}`}
    >
      {initials}
    </span>
  );
}

export function CardAssigneePlaceholder() {
  return (
    <span
      className="ops-board-card__chip ops-board-card__chip--assignee ops-board-card__chip--unassigned"
      title="Unassigned"
      aria-label="Unassigned"
    >
      ?
    </span>
  );
}

export function CardMoneySignal({
  badge,
  quoteTotal,
  balanceDue,
}: {
  badge: MoneyBadge;
  quoteTotal: number;
  balanceDue: number;
}) {
  const label = MONEY_LABEL[badge];
  if (!label || badge === 'none') {
    return null;
  }

  const amount =
    badge === 'balance_due'
      ? formatMoneyCompact(balanceDue)
      : badge === 'paid'
        ? null
        : formatMoneyCompact(quoteTotal);

  if (!amount && badge !== 'paid') {
    return null;
  }

  return (
    <span className={cn('ops-board-card__signal ops-board-card__signal--money', MONEY_SIGNAL_CLASS[badge])}>
      <CircleDollarSign className="ops-board-card__signal-icon" strokeWidth={2.25} aria-hidden />
      {amount ? <span className="tabular-nums">{amount}</span> : null}
      {label ? (
        <span className={amount ? 'opacity-90' : undefined}>
          {amount && badge !== 'paid' ? ` ${label}` : label}
        </span>
      ) : null}
    </span>
  );
}

export function CardScheduleSignal({ scheduledStart }: { scheduledStart: string }) {
  const label = formatScheduleLabel(scheduledStart);
  const isToday = label === 'Today';

  return (
    <span
      className={cn(
        'ops-board-card__signal',
        isToday ? 'ops-board-card__signal--today' : 'ops-board-card__signal--neutral',
      )}
    >
      <CalendarDays className="ops-board-card__signal-icon" strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}

export function CardDueSignal({
  dueDate,
  isOverdue,
}: {
  dueDate: string;
  isOverdue: boolean;
}) {
  const label = formatDueLabel(dueDate);
  const soon = !isOverdue && isDueSoon(dueDate);

  return (
    <span
      className={cn(
        'ops-board-card__signal',
        isOverdue
          ? 'ops-board-card__signal--urgent'
          : soon
            ? 'ops-board-card__signal--billing'
            : 'ops-board-card__signal--neutral',
      )}
    >
      <Clock3 className="ops-board-card__signal-icon" strokeWidth={2.25} aria-hidden />
      {label}
    </span>
  );
}

export function CardDaysSignal({ days }: { days: number }) {
  return (
    <span className="ops-board-card__signal ops-board-card__signal--neutral">
      <Clock3 className="ops-board-card__signal-icon" strokeWidth={2.25} aria-hidden />
      {days}d
    </span>
  );
}

export function CardSignalOverflow({ count }: { count: number }) {
  if (count <= 0) {
    return null;
  }

  return (
    <span className="ops-board-card__chip ops-board-card__chip--overflow" aria-label={`${count} more signals`}>
      +{count}
    </span>
  );
}

export function CardMetaRow({ card }: { card: BoardCardView }) {
  const primarySignals: ReactNode[] = [];

  if (card.jobType) {
    primarySignals.push(<CardJobTypeChip key="job-type" jobType={card.jobType} />);
  }

  if (card.moneyBadge !== 'none') {
    primarySignals.push(
      <CardMoneySignal
        key="money"
        badge={card.moneyBadge}
        quoteTotal={card.quoteTotal}
        balanceDue={card.balanceDue}
      />,
    );
  }

  if (card.dueDate && (card.isOverdue || isDueSoon(card.dueDate))) {
    primarySignals.push(
      <CardDueSignal key="due" dueDate={card.dueDate} isOverdue={card.isOverdue} />,
    );
  }

  if (card.scheduledStart) {
    primarySignals.push(<CardScheduleSignal key="schedule" scheduledStart={card.scheduledStart} />);
  }

  const showDaysBadge = card.columnCategory === 'sales' && card.daysInColumn > 2;
  if (showDaysBadge) {
    primarySignals.push(<CardDaysSignal key="days" days={card.daysInColumn} />);
  }

  const hasAssignee = Boolean(card.assigneeInitials);
  const maxPrimary = hasAssignee ? 3 : 4;
  const visible = primarySignals.slice(0, maxPrimary);
  const overflowCount = primarySignals.length - visible.length;

  const isEmpty = primarySignals.length === 0;

  return (
    <div className={cn('ops-board-card__meta', isEmpty && 'ops-board-card__meta--sparse')}>
      <div className="ops-board-card__meta-primary">
        {isEmpty ? (
          <span className="ops-board-card__meta-placeholder">Add estimate or schedule</span>
        ) : (
          <>
            {visible}
            <CardSignalOverflow count={overflowCount} />
          </>
        )}
      </div>
      <div className="ops-board-card__meta-assignee">
        {hasAssignee ? (
          <CardAssigneeChip initials={card.assigneeInitials!} name={card.assigneeName} />
        ) : (
          <CardAssigneePlaceholder />
        )}
      </div>
    </div>
  );
}

/** @deprecated Use CardMetaRow */
export function CardSignalsRow({ card }: { card: BoardCardView }) {
  return <CardMetaRow card={card} />;
}

export function CardPropertyLine({ line }: { line: string }) {
  return (
    <p className="ops-board-card__property" title={line}>
      <MapPin className="ops-board-card__property-icon" strokeWidth={2.25} aria-hidden />
      <span className="truncate">{line}</span>
    </p>
  );
}

export function CardFooter({
  nextAction,
  daysInColumn,
  isOverdue,
  columnCategory,
}: {
  nextAction: string | null;
  daysInColumn: number;
  isOverdue: boolean;
  columnCategory: ColumnCategory;
}) {
  const next = nextAction ? truncateText(nextAction, 52) : null;
  const showStageDays = columnCategory !== 'sales' || daysInColumn > 2;
  const stageParts: string[] = [];

  if (isOverdue) {
    stageParts.push('Overdue');
  }

  if (showStageDays) {
    stageParts.push(`${daysInColumn}d in column`);
  }

  const stageText = stageParts.join(' · ');

  if (!next && !stageText) {
    return null;
  }

  return (
    <footer className="ops-board-card__footer">
      <p
        className="ops-board-card__footer-line"
        title={[nextAction, stageText].filter(Boolean).join(' · ') || undefined}
      >
        {next ? (
          <>
            <span className="ops-board-card__next-label">Next</span>
            <span className="ops-board-card__next-sep" aria-hidden>
              :
            </span>
            <span className="ops-board-card__next-text">{next}</span>
          </>
        ) : null}
        {next && stageText ? (
          <span className="ops-board-card__footer-sep" aria-hidden>
            {' '}
            ·{' '}
          </span>
        ) : null}
        {stageText ? (
          <span className={cn('ops-board-card__stage', isOverdue && 'ops-board-card__stage--overdue')}>
            {stageText}
          </span>
        ) : null}
      </p>
    </footer>
  );
}
