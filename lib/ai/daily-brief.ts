import type { BoardAiContext } from '@/lib/ai/context-loader';

export type DailyBriefItem = {
  priority: number;
  title: string;
  cardId?: string;
  reason: string;
};

export type DailyBrief = {
  scheduledToday: DailyBriefItem[];
  overdue: DailyBriefItem[];
  stalled: DailyBriefItem[];
  completeUnpaid: DailyBriefItem[];
  topActions: DailyBriefItem[];
};

export function buildDailyBrief(context: BoardAiContext): DailyBrief {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const scheduledToday = context.visibleCards
    .filter((card) => {
      if (!card.scheduledStart) return false;
      const start = new Date(card.scheduledStart);
      return start >= today && start < tomorrow;
    })
    .map((card, index) => ({
      priority: index + 1,
      title: card.title,
      cardId: card.id,
      reason: 'Scheduled today',
    }));

  const overdue = context.visibleCards
    .filter((card) => card.dueDate && new Date(card.dueDate).getTime() < Date.now())
    .slice(0, 5)
    .map((card, index) => ({
      priority: index + 1,
      title: card.title,
      cardId: card.id,
      reason: 'Past due date',
    }));

  const stalled = context.visibleCards
    .filter((card) => ['estimate_sent', 'negotiation', 'blocked'].includes(card.stateKey))
    .slice(0, 5)
    .map((card, index) => ({
      priority: index + 1,
      title: card.title,
      cardId: card.id,
      reason: `Stuck in ${card.stateKey.replace(/_/g, ' ')}`,
    }));

  const completeUnpaid = context.visibleCards
    .filter((card) => card.stateKey === 'complete' && card.moneyBadge === 'balance_due')
    .slice(0, 5)
    .map((card, index) => ({
      priority: index + 1,
      title: card.title,
      cardId: card.id,
      reason: 'Complete but unpaid',
    }));

  const topActions = [...overdue, ...stalled, ...completeUnpaid]
    .slice(0, 3)
    .map((item, index) => ({ ...item, priority: index + 1 }));

  return { scheduledToday, overdue, stalled, completeUnpaid, topActions };
}

export function formatDailyBrief(brief: DailyBrief, metrics: BoardAiContext['metrics']): string {
  const lines: string[] = ['**Morning brief**'];

  lines.push(
    `• ${metrics.scheduledTodayCount} scheduled today · ${metrics.overdueCount} overdue · ${brief.stalled.length} need follow-up`,
  );

  if (brief.scheduledToday.length) {
    lines.push('', '**Today’s crew runs**');
    for (const item of brief.scheduledToday.slice(0, 5)) {
      lines.push(`• ${item.title}`);
    }
  }

  if (brief.topActions.length) {
    lines.push('', '**Top 3 actions**');
    for (const item of brief.topActions) {
      lines.push(`• ${item.title} — ${item.reason}`);
    }
  } else {
    lines.push('', 'Pipeline looks clear — review new inquiries or schedule upcoming jobs.');
  }

  return lines.join('\n');
}
