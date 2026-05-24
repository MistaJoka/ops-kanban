'use client';

import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ApprovalModal } from '@/components/ai/ApprovalModal';
import type { AiClientContext } from '@/components/ai/AiDock';
import { cn } from '@/lib/utils';

type PendingItem = {
  id: string;
  toolCallId: string;
  toolName: string;
  cardId: string | null;
  preview: { summary: string; input: Record<string, unknown>; details?: string[] };
  createdAt: string;
};

const POLL_MS = 30_000;

export function NotificationsBell() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [open, setOpen] = useState(false);
  const [appContext, setAppContext] = useState<AiClientContext | null>(null);
  const [activeApproval, setActiveApproval] = useState<PendingItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadPending = useCallback(async () => {
    try {
      const response = await fetch('/api/ai/pending');
      if (!response.ok) return;
      const payload = await response.json();
      const data = payload.data as { count: number; items: PendingItem[] };
      setCount(data.count);
      setItems(data.items);
    } catch {
      // Silent — bell is non-critical
    }
  }, []);

  useEffect(() => {
    void fetch('/api/app/context')
      .then((response) => response.json())
      .then((payload) => {
        const data = payload.data as {
          organizationId: string;
          userId: string | null;
          role: string;
        };
        if (data.userId) {
          setAppContext({
            page: 'board',
            organizationId: data.organizationId,
            userId: data.userId,
            role: data.role,
          });
        }
      })
      .catch(() => undefined);

    void loadPending();
    const interval = window.setInterval(() => void loadPending(), POLL_MS);
    return () => window.clearInterval(interval);
  }, [loadPending]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!appContext) {
    return null;
  }

  return (
    <>
      <div className="relative" ref={panelRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ops-btn-secondary relative inline-flex size-9 items-center justify-center px-0"
          aria-label={count > 0 ? `${count} pending AI approvals` : 'AI approvals'}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          <Bell className="size-4" strokeWidth={2.25} aria-hidden />
          {count > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-[var(--accent)] text-[9px] font-bold text-white">
              {count > 9 ? '9+' : count}
            </span>
          ) : null}
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-72 rounded-[var(--radius-control)] border bg-[var(--surface-raised)] p-2 shadow-lg"
            style={{ borderColor: 'var(--topbar-border)' }}
          >
            <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-tertiary)]">
              Pending AI actions
            </p>
            {items.length === 0 ? (
              <p className="px-2 py-3 text-sm text-[var(--text-secondary)]">Nothing waiting.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="menuitem"
                      className={cn(
                        'w-full rounded-md px-2 py-2 text-left text-sm transition-colors',
                        'hover:bg-[var(--surface-inset)]',
                      )}
                      onClick={() => {
                        setActiveApproval(item);
                        setOpen(false);
                      }}
                    >
                      <span className="line-clamp-2 font-medium text-[var(--text-primary)]">
                        {item.preview.summary}
                      </span>
                      <span className="mt-0.5 block font-mono text-[10px] text-[var(--text-tertiary)]">
                        {item.toolName}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : null}
      </div>

      {activeApproval ? (
        <ApprovalModal
          toolCallId={activeApproval.toolCallId}
          toolName={activeApproval.toolName}
          preview={activeApproval.preview}
          context={{
            ...appContext,
            selectedCardId: activeApproval.cardId ?? undefined,
          }}
          onClose={() => setActiveApproval(null)}
          onComplete={() => {
            setActiveApproval(null);
            void loadPending();
          }}
        />
      ) : null}
    </>
  );
}
