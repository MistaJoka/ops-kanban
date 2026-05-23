'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

import { AiDock, type AiClientContext } from '@/components/ai/AiDock';
import { cn } from '@/lib/utils';

const DOCK_EXPANDED_KEY = 'opsboard-ai-dock-expanded';

function readExpandedPreference(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(DOCK_EXPANDED_KEY) === 'true';
}

export function AiCommandDock({
  context,
  expanded,
  onExpandedChange,
  onRefresh,
}: {
  context: AiClientContext;
  expanded: boolean;
  onExpandedChange: (value: boolean) => void;
  onRefresh?: () => void;
}) {
  const userExpandedRef = useRef(false);
  const [barHint, setBarHint] = useState<string | null>(null);

  useEffect(() => {
    if (readExpandedPreference()) {
      onExpandedChange(true);
      userExpandedRef.current = true;
    }
  }, [onExpandedChange]);

  useEffect(() => {
    if (context.page === 'card' && expanded && !userExpandedRef.current) {
      onExpandedChange(false);
    }
  }, [context.page, context.selectedCardId, expanded, onExpandedChange]);

  const setExpanded = useCallback(
    (next: boolean, fromUser = false) => {
      if (fromUser) {
        userExpandedRef.current = next;
      }
      onExpandedChange(next);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(DOCK_EXPANDED_KEY, String(next));
      }
    },
    [onExpandedChange],
  );

  const barLabel =
    barHint ?? (context.page === 'card' ? 'Ask about this job…' : 'Ask about today’s jobs…');

  return (
    <div
      className={cn('ops-ai-dock', expanded ? 'ops-ai-dock--expanded' : 'ops-ai-dock--collapsed')}
      role="region"
      aria-label="Ops copilot"
      aria-expanded={expanded}
    >
      {!expanded ? (
        <button
          type="button"
          className="ops-ai-dock__bar"
          onClick={() => setExpanded(true, true)}
          aria-label="Expand Ops copilot"
        >
          <Sparkles className="size-4 shrink-0 text-[var(--accent)]" strokeWidth={2.25} />
          <span className="ops-ai-dock__bar-placeholder">{barLabel}</span>
          <ChevronUp className="size-4 shrink-0 text-[var(--text-tertiary)]" strokeWidth={2.25} />
        </button>
      ) : (
        <>
          <button
            type="button"
            className="ops-ai-dock__bar border-b"
            style={{ borderColor: 'var(--topbar-border)', height: 'var(--ai-dock-collapsed)' }}
            onClick={() => setExpanded(false, true)}
            aria-label="Collapse Ops copilot"
          >
            <Sparkles className="size-4 shrink-0 text-[var(--accent)]" strokeWidth={2.25} />
            <span className="ops-ai-dock__bar-placeholder font-medium text-[var(--text-primary)]">
              Ops copilot
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-[var(--text-tertiary)]"
              strokeWidth={2.25}
            />
          </button>
          <div className="ops-ai-dock__body">
            <AiDock
              context={context}
              onRefresh={onRefresh}
              variant="dock"
              onAssistantActivity={() => {
                if (!expanded) {
                  setBarHint('Daily brief ready — expand to read');
                }
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
