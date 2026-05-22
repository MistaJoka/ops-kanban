'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';

import { ApprovalModal } from '@/components/ai/ApprovalModal';
import { cn } from '@/lib/utils';

export type AiClientContext = {
  page: 'board' | 'card';
  organizationId: string;
  userId: string;
  role: string;
  selectedCardId?: string;
  pipelineMode?: 'compact' | 'full';
};

type AiResponse =
  | { status: 'message'; message: string }
  | {
      status: 'executed';
      message: string;
      toolName?: string;
      data?: unknown;
    }
  | {
      status: 'approval_required';
      message: string;
      toolCallId: string;
      toolName: string;
      preview: { summary: string; input: Record<string, unknown> };
    };

const BOARD_CHIPS = [
  'Show overdue jobs',
  'Pipeline status',
  'Any stalled jobs?',
];

const CARD_CHIPS = [
  'Summarize this job',
  'Suggest next action',
  'Draft estimate from scope',
];

export function AiDock({
  context,
  onRefresh,
  compact = false,
}: {
  context: AiClientContext;
  onRefresh?: () => void;
  compact?: boolean;
}) {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [approval, setApproval] = useState<AiResponse | null>(null);
  const chips = context.page === 'card' ? CARD_CHIPS : BOARD_CHIPS;

  const submit = async (value: string) => {
    if (!value.trim() || !context.userId) return;

    setLoading(true);
    setResponse(null);
    setApproval(null);

    try {
      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: value.trim(),
          context: {
            ...context,
            mode: 'ask',
          },
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        setResponse(payload.error ?? 'AI request failed.');
        return;
      }

      const data = payload.data as AiResponse;

      if (data.status === 'approval_required') {
        setApproval(data);
        setResponse(data.message);
        return;
      }

      setResponse(data.message ?? 'Done.');
      onRefresh?.();
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'AI request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section
        aria-label="Ops copilot"
        className={cn(
          'border-t bg-[var(--surface-rail)]',
          compact ? 'p-3' : 'p-4',
        )}
        style={{ borderColor: 'var(--topbar-border)' }}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-6 items-center justify-center rounded-md bg-[var(--accent-muted)] text-[var(--accent)]">
              <Sparkles className="size-3.5" strokeWidth={2.25} />
            </span>
            <h2 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
              Ops copilot
            </h2>
          </div>
          <span className="rounded-md border border-[var(--border-subtle)] bg-[var(--control-bg)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
            {context.role}
          </span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={loading}
              onClick={() => {
                setCommand(chip);
                void submit(chip);
              }}
              className="ops-chip disabled:opacity-60"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submit(command);
            }}
            placeholder="Ask, analyze, or act on your pipeline…"
            aria-label="AI command"
            className="field-input flex-1"
          />
          <button
            type="button"
            disabled={loading || !command.trim()}
            onClick={() => void submit(command)}
            className="ops-btn-primary min-w-[4.5rem]"
          >
            {loading ? '…' : 'Run'}
          </button>
        </div>

        {response ? (
          <p
            role="status"
            aria-live="polite"
            className="mt-3 rounded-[var(--radius-control)] border bg-[var(--control-bg)] px-3 py-2.5 text-sm leading-relaxed text-[var(--text-primary)]"
            style={{
              borderColor: 'var(--topbar-border)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {response}
          </p>
        ) : null}
      </section>

      {approval?.status === 'approval_required' ? (
        <ApprovalModal
          toolCallId={approval.toolCallId}
          toolName={approval.toolName}
          preview={approval.preview}
          context={context}
          onClose={() => setApproval(null)}
          onComplete={(message) => {
            setApproval(null);
            setResponse(message);
            onRefresh?.();
          }}
        />
      ) : null}
    </>
  );
}

export function AiRail(props: {
  context: AiClientContext;
  onRefresh?: () => void;
}) {
  return <AiDock {...props} compact />;
}
