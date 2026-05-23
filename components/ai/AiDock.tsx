'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';

import { ApprovalModal } from '@/components/ai/ApprovalModal';
import { submitAiCommand, type AiCommandResponse } from '@/lib/ai/ai-command-client';
import type { AiMode, AiPage } from '@/lib/ai/context-loader';
import { cn } from '@/lib/utils';

export type AiClientContext = {
  page: AiPage;
  organizationId: string;
  userId: string;
  role: string;
  selectedCardId?: string;
  selectedCustomerId?: string;
  calendarRange?: { start: string; end: string };
  pipelineMode?: 'compact' | 'full';
};

type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
};

type AiResponse = AiCommandResponse;

const MODES: Array<{ id: AiMode; label: string }> = [
  { id: 'ask', label: 'Ask' },
  { id: 'analyze', label: 'Analyze' },
  { id: 'act', label: 'Act' },
  { id: 'draft', label: 'Draft' },
];

const BOARD_CHIPS: Record<AiMode, string[]> = {
  ask: ['Pipeline status', 'Jobs scheduled today'],
  analyze: ['Daily brief', 'Show overdue jobs', 'Any stalled jobs?'],
  act: ['Create job from notes', 'Move to scheduled', 'Delete job by title'],
  draft: ['Draft follow-up SMS', 'Draft estimate from scope'],
  automate: ['Suggest morning routine'],
};

const CARD_CHIPS: Record<AiMode, string[]> = {
  ask: ['Summarize this job', 'What’s missing before we schedule?'],
  analyze: ['Suggest next action', 'Summarize this job'],
  act: ['Move to scheduled', 'Set next action: call customer'],
  draft: ['Draft estimate from scope notes', 'Draft follow-up email'],
  automate: ['Suggest next action'],
};

function defaultMode(page: AiPage): AiMode {
  if (page === 'board' || page === 'dashboard') {
    const hour = new Date().getHours();
    return hour < 10 ? 'analyze' : 'ask';
  }
  if (page === 'calendar') return 'analyze';
  if (page === 'card') return 'draft';
  return 'ask';
}

function isMorningBriefWindow(): boolean {
  const hour = new Date().getHours();
  return hour >= 5 && hour < 11;
}

export function AiDock({
  context,
  onRefresh,
  compact = false,
  variant = compact ? 'rail' : 'default',
  suggestedChips,
  onAssistantActivity,
  autoFocus = false,
}: {
  context: AiClientContext;
  onRefresh?: () => void;
  compact?: boolean;
  variant?: 'default' | 'dock' | 'rail';
  suggestedChips?: string[];
  onAssistantActivity?: () => void;
  autoFocus?: boolean;
}) {
  const [mode, setMode] = useState<AiMode>(() => defaultMode(context.page));
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(false);
  const [streamPhase, setStreamPhase] = useState<string | null>(null);
  const [approval, setApproval] = useState<AiResponse | null>(null);
  const [briefLoaded, setBriefLoaded] = useState(false);
  const [listening, setListening] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);

  const chips =
    suggestedChips ??
    (context.page === 'card' ? CARD_CHIPS[mode] : BOARD_CHIPS[mode]);

  useEffect(() => {
    setMode(defaultMode(context.page));
    setHistory([]);
    setBriefLoaded(false);
  }, [context.page, context.selectedCardId]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, loading]);

  useEffect(() => {
    if (!autoFocus) return;
    commandInputRef.current?.focus();
  }, [autoFocus, context.page, context.selectedCardId]);

  useEffect(() => {
    if (history.some((turn) => turn.role === 'assistant' && turn.content.trim())) {
      onAssistantActivity?.();
    }
  }, [history, onAssistantActivity]);

  useEffect(() => {
    if (
      (context.page === 'board' || context.page === 'dashboard') &&
      mode === 'analyze' &&
      isMorningBriefWindow() &&
      !briefLoaded &&
      context.userId &&
      history.length === 0
    ) {
      setBriefLoaded(true);
      void submit('Daily brief', 'analyze', []);
    }
  }, [context.page, mode, briefLoaded, context.userId, history.length]);

  const submit = async (
    value: string,
    submitMode: AiMode = mode,
    priorHistory: ConversationTurn[] = history,
  ) => {
    if (!value.trim() || !context.userId) return;

    const userTurn: ConversationTurn = { role: 'user', content: value.trim() };
    const nextHistory = [...priorHistory, userTurn];

    setLoading(true);
    setStreamPhase(null);
    setHistory([...nextHistory, { role: 'assistant', content: '' }]);
    setApproval(null);
    setCommand('');

    const updateAssistant = (content: string) => {
      setHistory((current) => {
        const copy = [...current];
        const lastIndex = copy.length - 1;
        if (lastIndex >= 0 && copy[lastIndex]?.role === 'assistant') {
          copy[lastIndex] = { role: 'assistant', content };
        }
        return copy;
      });
    };

    let streamed = '';

    try {
      const data = await submitAiCommand(
        {
          command: value.trim(),
          conversationHistory: priorHistory,
          context: {
            ...context,
            mode: submitMode,
          },
        },
        {
          onStatus: (phase) => setStreamPhase(phase),
          onDelta: (text) => {
            streamed += text;
            updateAssistant(streamed);
          },
        },
      );

      const assistantMessage =
        data.status === 'approval_required'
          ? data.message || data.preview.summary
          : (data.message ?? streamed) || 'Done.';

      updateAssistant(assistantMessage);

      if (data.status === 'approval_required') {
        setApproval(data);
        return;
      }

      onRefresh?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'AI request failed.';
      updateAssistant(errorMessage);
    } finally {
      setLoading(false);
      setStreamPhase(null);
    }
  };

  const startVoice = () => {
    type VoiceRecognition = {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      onresult:
        | ((event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void)
        | null;
      onerror: (() => void) | null;
      onend: (() => void) | null;
      start: () => void;
      stop: () => void;
    };

    const SpeechRecognitionCtor =
      typeof window !== 'undefined'
        ? (window as Window & { SpeechRecognition?: new () => VoiceRecognition }).SpeechRecognition ||
          (window as Window & { webkitSpeechRecognition?: new () => VoiceRecognition })
            .webkitSpeechRecognition
        : undefined;

    if (!SpeechRecognitionCtor) {
      setHistory((current) => [
        ...current,
        { role: 'assistant', content: 'Voice input is not supported in this browser.' },
      ]);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setCommand(transcript);
        void submit(transcript);
      }
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  };

  return (
    <>
      <section
        aria-label={variant === 'dock' ? undefined : 'Ops copilot'}
        className={cn(
          'bg-[var(--surface-rail)]',
          variant === 'dock' ? 'flex min-h-0 flex-1 flex-col p-2' : 'border-t',
          variant === 'rail' ? 'p-3' : variant === 'default' ? 'p-4' : '',
        )}
        style={variant !== 'dock' ? { borderColor: 'var(--topbar-border)' } : undefined}
      >
        {variant !== 'dock' ? (
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
        ) : (
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-[var(--accent)]" strokeWidth={2.25} />
              <span className="text-xs font-semibold text-[var(--text-primary)]">Ops copilot</span>
            </div>
            <span className="font-mono text-[9px] uppercase tracking-wide text-[var(--text-tertiary)]">
              {context.role}
            </span>
          </div>
        )}

        <div className={cn('flex flex-wrap gap-1.5', variant === 'dock' ? 'mb-1.5' : 'mb-3')}>
          {MODES.filter((item) => item.id !== 'automate').map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              className={cn(
                'ops-chip',
                mode === item.id && 'border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent)]',
              )}
              aria-pressed={mode === item.id}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className={cn('flex flex-wrap gap-1.5', variant === 'dock' ? 'mb-1.5 max-h-8 overflow-x-auto' : 'mb-3')}>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={loading}
              onClick={() => void submit(chip)}
              className="ops-chip disabled:opacity-60"
            >
              {chip}
            </button>
          ))}
        </div>

        {history.length > 0 ? (
          <div
            ref={threadRef}
            className={cn(
              'mb-3 space-y-2 overflow-y-auto rounded-[var(--radius-control)] border bg-[var(--control-bg)]',
              variant === 'dock' ? 'max-h-[72px] flex-1 p-2 text-xs' : 'max-h-48 p-3',
            )}
            style={{ borderColor: 'var(--topbar-border)' }}
            aria-live="polite"
          >
            {history.map((turn, index) => (
              <div
                key={`${turn.role}-${index}`}
                className={cn(
                  'text-sm leading-relaxed',
                  turn.role === 'user'
                    ? 'text-[var(--text-secondary)]'
                    : 'text-[var(--text-primary)]',
                )}
              >
                <span className="mr-1.5 font-medium uppercase tracking-wide text-[10px] text-[var(--text-tertiary)]">
                  {turn.role === 'user' ? 'You' : 'Copilot'}
                </span>
                <span className="whitespace-pre-wrap">{turn.content}</span>
              </div>
            ))}
            {loading ? (
              <p className="text-sm text-[var(--text-secondary)]">
                {streamPhase === 'executing'
                  ? 'Running action…'
                  : streamPhase === 'polishing'
                    ? 'Polishing reply…'
                    : streamPhase === 'tool'
                      ? 'Selecting tool…'
                      : streamPhase === 'context'
                        ? 'Loading context…'
                        : 'Thinking…'}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className={cn('flex gap-2', variant === 'dock' && 'shrink-0')}>
          <button
            type="button"
            disabled={loading || listening}
            onClick={startVoice}
            className={cn('ops-btn-secondary', variant === 'dock' ? 'size-8 px-0' : 'px-2.5')}
            aria-label="Voice input"
            title="Voice input"
          >
            <Mic className="size-4" strokeWidth={2.25} />
          </button>
          <input
            ref={commandInputRef}
            value={command}
            onChange={(event) => setCommand(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submit(command);
            }}
            placeholder={
              mode === 'analyze'
                ? 'Analyze pipeline, overdue jobs, or revenue…'
                : mode === 'act'
                  ? 'Tell me what to create, move, or update…'
                  : mode === 'draft'
                    ? 'Draft an estimate, note, or message…'
                    : 'Ask about today’s jobs, pipeline, or money…'
            }
            aria-label="AI command"
            className={cn('field-input flex-1', variant === 'dock' && 'h-8 text-xs')}
          />
          <button
            type="button"
            disabled={loading || !command.trim()}
            onClick={() => void submit(command)}
            className={cn('ops-btn-primary', variant === 'dock' ? 'h-8 min-w-[3.5rem] text-xs' : 'min-w-[4.5rem]')}
          >
            {loading ? '…' : 'Run'}
          </button>
        </div>
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
            setHistory((current) => [...current, { role: 'assistant', content: message }]);
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
  return <AiDock {...props} variant="rail" compact />;
}
