'use client';

import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

import { AiCopilotPopover } from '@/components/ai/AiCopilotPopover';
import type { AiClientContext } from '@/components/ai/AiDock';

const PAGE_CHIPS: Record<AiClientContext['page'], string[]> = {
  board: ['Daily brief', 'Show overdue jobs'],
  card: ['Summarize this job', 'Draft estimate from scope'],
  dashboard: ['Daily brief', 'Who owes money?', 'Revenue summary'],
  calendar: ['Show this week', 'Any schedule conflicts?'],
  customer: ['Search customers', 'Summarize customer history'],
  reports: ['Revenue summary', 'Unpaid invoices'],
  settings: ['Pipeline status'],
};

export function AiPageCopilot({
  page,
  selectedCustomerId,
  calendarRange,
  onRefresh,
}: {
  page: AiClientContext['page'];
  selectedCustomerId?: string;
  calendarRange?: { start: string; end: string };
  onRefresh?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState<AiClientContext | null>(null);

  useEffect(() => {
    void fetch('/api/app/context')
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.data?.userId) return;
        setContext({
          page,
          organizationId: payload.data.organizationId,
          userId: payload.data.userId,
          role: payload.data.role,
          selectedCustomerId,
          calendarRange,
        });
      })
      .catch(() => undefined);
  }, [page, selectedCustomerId, calendarRange?.start, calendarRange?.end]);

  const chips = PAGE_CHIPS[page] ?? [];

  if (!context) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full border bg-[var(--surface-rail)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] shadow-none"
        style={{ borderColor: 'var(--topbar-border)' }}
        aria-label="Open Ops copilot"
      >
        <Sparkles className="size-4 text-[var(--accent)]" strokeWidth={2.25} />
        Ops copilot
      </button>

      <AiCopilotPopover
        open={open}
        onClose={() => setOpen(false)}
        context={context}
        onRefresh={onRefresh}
        suggestedChips={chips}
      />
    </>
  );
}
