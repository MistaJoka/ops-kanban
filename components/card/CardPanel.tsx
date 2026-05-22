'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, MoreVertical } from 'lucide-react';

import type { CardActivityView, CardCommentView, CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { BoardColumnView } from '@/lib/domain/board/getBoard';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import type { PaymentView } from '@/lib/domain/integrations/payments';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { QuoteView } from '@/lib/domain/money/quotes';
import { CATEGORY_ACCENT, COLUMN_CATEGORY } from '@/lib/domain/pipeline/types';
import type { BoardSyncHandlers } from '@/components/pipeline/useBoardState';
import type { MoveCardResult } from '@/components/pipeline/useBoardState';
import { IntegrationStrip } from '@/components/card/IntegrationStrip';
import { ActivityTimeline } from '@/components/card/ActivityTimeline';
import type { CardIntegrationSummary } from '@/lib/domain/integrations/cardIntegrationSummary';
import { CommsTab } from '@/components/card/CommsTab';
import { FilesTab } from '@/components/card/FilesTab';
import { EstimateTab } from '@/components/card/EstimateTab';
import { MoneyTab } from '@/components/card/MoneyTab';
import { MovePromptModal } from '@/components/card/MovePromptModal';
import { AiRail } from '@/components/ai/AiDock';
import { ApprovalModal } from '@/components/ai/ApprovalModal';
import { CardAiSummary } from '@/components/ai/CardAiSummary';
import { getCardPropertyLabel } from '@/components/pipeline/board-card-primitives';
import { cn } from '@/lib/utils';

type TabKey =
  | 'overview'
  | 'property'
  | 'scope'
  | 'schedule'
  | 'comments'
  | 'checklist'
  | 'estimate'
  | 'money'
  | 'comms'
  | 'files';

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'property', label: 'Property' },
  { key: 'scope', label: 'Scope' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'comments', label: 'Comments' },
  { key: 'checklist', label: 'Checklist' },
  { key: 'estimate', label: 'Estimate' },
  { key: 'money', label: 'Money' },
  { key: 'comms', label: 'Comms' },
  { key: 'files', label: 'Files' },
];

type CardPayload = {
  card: CardDetailView;
  activities: CardActivityView[];
  comments: CardCommentView[];
  quote: QuoteView | null;
  invoice: InvoiceView | null;
  payment: PaymentView | null;
  integrations?: CardIntegrationSummary;
};

export function CardPanel({
  cardId,
  columns,
  role,
  organizationId,
  userId,
  onClose,
  boardSync,
  onMoveCard,
}: {
  cardId: string;
  columns: BoardColumnView[];
  role: string;
  organizationId: string;
  userId: string | null;
  onClose: () => void;
  boardSync: BoardSyncHandlers;
  onMoveCard: (
    cardId: string,
    targetColumnId: string,
    extras?: { reason?: string },
  ) => Promise<MoveCardResult>;
}) {
  const [payload, setPayload] = useState<CardPayload | null>(null);
  const [members, setMembers] = useState<OrgMemberView[]>([]);
  const [tab, setTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [movePrompt, setMovePrompt] = useState<{
    targetColumnId: string;
    type: 'schedule' | 'reason' | 'error';
    message: string;
  } | null>(null);
  const [aiApproval, setAiApproval] = useState<{
    toolCallId: string;
    toolName: string;
    preview: { summary: string; input: Record<string, unknown> };
    message: string;
  } | null>(null);
  const [aiDraftLoading, setAiDraftLoading] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [twilioEnabled, setTwilioEnabled] = useState(false);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [changeOrders, setChangeOrders] = useState<Array<{ id: string; title: string }>>([]);

  const loadCard = async (syncBoard = false) => {
    setLoading(true);
    setError(null);

    try {
      const [response, changeOrderResponse] = await Promise.all([
        fetch(`/api/cards/${cardId}`),
        fetch(`/api/cards/${cardId}/change-orders`),
      ]);
      const data = await response.json();
      const changeOrderData = await changeOrderResponse.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to load card.');
      }
      setPayload(data.data);
      if (syncBoard && data.data?.card) {
        boardSync.syncFromDetail(data.data.card);
      }
      if (changeOrderData.data) {
        setChangeOrders(changeOrderData.data);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load card.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCard();
    void fetch('/api/members')
      .then((response) => response.json())
      .then((data) => {
        if (data.data) setMembers(data.data);
      });
    void fetch('/api/integrations')
      .then((response) => response.json())
      .then((data) => {
        const stripe = data.data?.stripe;
        if (stripe?.configured && stripe.status === 'active') {
          setStripeEnabled(true);
        }
        const twilio = data.data?.twilio;
        if (twilio?.configured && twilio.status === 'active') {
          setTwilioEnabled(true);
        }
        if (data.data?.resend?.configured) {
          setResendEnabled(true);
        }
      });
  }, [cardId]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const patchCard = async (patch: Record<string, unknown>) => {
    if (!payload) {
      return;
    }

    const previousPayload = payload;
    const optimisticCard = applyDetailPatch(payload.card, patch);
    setPayload({ ...payload, card: optimisticCard });
    boardSync.syncFromDetail(optimisticCard);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save.');
      }

      setPayload((current) => (current ? { ...current, card: data.data } : current));
      boardSync.syncFromDetail(data.data);
      boardSync.endOutboundSync(true);
    } catch (patchError) {
      setPayload(previousPayload);
      boardSync.syncFromDetail(previousPayload.card);
      const message = patchError instanceof Error ? patchError.message : 'Failed to save.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    }
  };

  const saveCustomer = async (form: FormData) => {
    if (!payload) {
      return;
    }

    const previousPayload = payload;
    const optimisticCard: CardDetailView = {
      ...payload.card,
      customer: {
        id: payload.card.customer?.id ?? 'temp-customer',
        name: String(form.get('name') ?? ''),
        phone: (form.get('phone') as string) || null,
        email: (form.get('email') as string) || null,
        address: (form.get('address') as string) || null,
        notes: (form.get('notes') as string) || null,
      },
      updatedAt: new Date().toISOString(),
    };

    setPayload({ ...payload, card: optimisticCard });
    boardSync.syncFromDetail(optimisticCard);
    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/customer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          phone: form.get('phone') || null,
          email: form.get('email') || null,
          address: form.get('address') || null,
          notes: form.get('notes') || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save customer.');
      }

      setPayload((current) => (current ? { ...current, card: data.data } : current));
      boardSync.syncFromDetail(data.data);
      boardSync.endOutboundSync(true);
    } catch (customerError) {
      setPayload(previousPayload);
      boardSync.syncFromDetail(previousPayload.card);
      const message =
        customerError instanceof Error ? customerError.message : 'Failed to save customer.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const attemptMove = async (
    targetColumnId: string,
    extras?: { reason?: string; scheduledStart?: string },
  ) => {
    if (extras?.scheduledStart) {
      await patchCard({ scheduledStart: extras.scheduledStart });
    }

    if (!payload) {
      return;
    }

    const targetColumn = columns.find((column) => column.id === targetColumnId);
    if (!targetColumn) {
      return;
    }

    const previousPayload = payload;
    const optimisticCard: CardDetailView = {
      ...payload.card,
      columnId: targetColumnId,
      stateKey: targetColumn.stateKey,
      columnCategory: COLUMN_CATEGORY[targetColumn.stateKey] ?? 'sales',
      updatedAt: new Date().toISOString(),
    };

    setPayload({ ...payload, card: optimisticCard });
    setError(null);

    const result = await onMoveCard(cardId, targetColumnId, { reason: extras?.reason });

    if (!result.ok) {
      setPayload(previousPayload);
      const code = result.code;
      const message = result.message;

      if (code === 'SCHEDULE_REQUIRED') {
        setMovePrompt({ targetColumnId, type: 'schedule', message });
        return;
      }

      if (code === 'ESTIMATE_REQUIRED') {
        setTab('estimate');
        setMovePrompt({ targetColumnId, type: 'error', message });
        return;
      }

      if (
        code === 'VALIDATION_ERROR' &&
        (message.toLowerCase().includes('reason') || message.toLowerCase().includes('balance'))
      ) {
        setMovePrompt({ targetColumnId, type: 'reason', message });
        return;
      }

      setMovePrompt({ targetColumnId, type: 'error', message });
      return;
    }

    setMovePrompt(null);
    setPayload((current) =>
      current ?
        {
          ...current,
          card: {
            ...current.card,
            columnId: result.card.columnId,
            stateKey: result.card.stateKey,
            columnCategory: result.card.columnCategory,
            updatedAt: result.card.updatedAt,
          },
        }
      : current,
    );
  };

  const addComment = async () => {
    if (!commentDraft.trim() || !payload) {
      return;
    }

    const body = commentDraft.trim();
    const optimisticComment: CardCommentView = {
      id: `temp-${crypto.randomUUID()}`,
      body,
      authorName: 'You',
      createdAt: new Date().toISOString(),
    };

    const previousPayload = payload;
    setPayload({
      ...payload,
      comments: [optimisticComment, ...payload.comments],
    });
    setCommentDraft('');
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to add comment.');
      }

      setPayload((current) =>
        current ?
          {
            ...current,
            comments: [
              data.data as CardCommentView,
              ...current.comments.filter((comment) => comment.id !== optimisticComment.id),
            ],
          }
        : current,
      );
      boardSync.endOutboundSync(true);
    } catch (commentError) {
      setPayload(previousPayload);
      setCommentDraft(body);
      const message =
        commentError instanceof Error ? commentError.message : 'Failed to add comment.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    }
  };

  const card = payload?.card;
  const currentColumn = columns.find((column) => column.id === card?.columnId);
  const propertyLabel = card
    ? getCardPropertyLabel(card.customer?.address, card.customer?.name, card.jobType)
    : null;
  const canManageMoney = role === 'owner' || role === 'manager';
  const aiContext =
    userId ?
      {
        page: 'card' as const,
        organizationId,
        userId,
        role,
        selectedCardId: cardId,
      }
    : null;

  const draftEstimateFromAi = async () => {
    if (!aiContext) return;

    setAiDraftLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: 'Draft estimate from scope notes',
          context: { ...aiContext, mode: 'draft' },
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? 'AI estimate draft failed.');
      }

      if (payload.data?.status === 'approval_required') {
        setAiApproval(payload.data);
        return;
      }

      await loadCard();
      setTab('estimate');
    } catch (draftError) {
      setError(draftError instanceof Error ? draftError.message : 'AI estimate draft failed.');
    } finally {
      setAiDraftLoading(false);
    }
  };

  const saveQuote = async (
    lineItems: Array<{ description: string; quantity: number; unitPrice: number }>,
  ) => {
    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lineItems }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to save estimate.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'estimate_draft' });
      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (quoteError) {
      const message = quoteError instanceof Error ? quoteError.message : 'Failed to save estimate.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const markQuoteSent = async () => {
    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/quotes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'sent' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to mark estimate sent.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'estimate_sent' });
      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (sentError) {
      const message =
        sentError instanceof Error ? sentError.message : 'Failed to mark estimate sent.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const createInvoice = async () => {
    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromQuoteId: payload?.quote?.id }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create invoice.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'invoice_draft' });
      await loadCard();
      setTab('money');
      boardSync.endOutboundSync(true);
    } catch (invoiceError) {
      const message = invoiceError instanceof Error ? invoiceError.message : 'Failed to create invoice.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async () => {
    if (!payload?.invoice) return;

    const confirmed = window.confirm(
      `Mark invoice paid ($${payload.invoice.total.toFixed(2)}) and archive this job?`,
    );
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/invoices/${payload.invoice.id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'manual' }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to mark paid.');
      }

      await loadCard(true);
      boardSync.endOutboundSync(true);
    } catch (paidError) {
      const message = paidError instanceof Error ? paidError.message : 'Failed to mark paid.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const createPaymentLink = async () => {
    if (!payload?.invoice) return;

    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/invoices/${payload.invoice.id}/payment-link`, {
        method: 'POST',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create payment link.');
      }

      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (linkError) {
      const message =
        linkError instanceof Error ? linkError.message : 'Failed to create payment link.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const copyJobLink = async () => {
    const url = `${window.location.origin}/pipeline?card=${cardId}`;
    await navigator.clipboard.writeText(url);
  };

  const archiveJob = async () => {
    const archivedColumn = columns.find((column) => column.stateKey === 'archived');
    if (!archivedColumn) {
      setError('Archived column not found.');
      return;
    }
    await attemptMove(archivedColumn.id);
  };

  const copyPortalLink = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards/${cardId}/portal-token`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create portal link.');
      }

      const url = data.data?.portalUrl as string | undefined;
      if (!url) {
        throw new Error('Portal link was not returned.');
      }

      await navigator.clipboard.writeText(url);
      setError(null);
    } catch (portalError) {
      setError(portalError instanceof Error ? portalError.message : 'Failed to copy portal link.');
    } finally {
      setSaving(false);
    }
  };

  const exportEstimate = () => {
    window.open(`/api/cards/${cardId}/quotes/export`, '_blank', 'noopener,noreferrer');
  };

  const sendEstimate = async () => {
    const email = window.prompt('Customer email for estimate delivery:');
    if (!email?.trim()) return;

    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/quotes/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to send estimate.');
      }

      boardSync.patchCard(cardId, { moneyBadge: 'estimate_sent' });
      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Failed to send estimate.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  const createChangeOrder = async () => {
    setSaving(true);
    setError(null);
    boardSync.beginOutboundSync();

    try {
      const response = await fetch(`/api/cards/${cardId}/change-orders`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to create change order.');
      }

      await loadCard();
      boardSync.endOutboundSync(true);
    } catch (orderError) {
      const message =
        orderError instanceof Error ? orderError.message : 'Failed to create change order.';
      setError(message);
      boardSync.endOutboundSync(false, message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="ops-panel-overlay" onClick={onClose} aria-hidden />
      <aside
        className="ops-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Job detail panel"
      >
        {loading && !payload?.card ? (
          <div
            className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-sm text-[var(--text-secondary)]"
            role="status"
            aria-live="polite"
          >
            <p>Loading job…</p>
          </div>
        ) : error && !payload?.card ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <p role="alert" className="text-sm text-[var(--urgent)]">
              {error}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => void loadCard()} className="ops-btn-primary">
                Try again
              </button>
              <button type="button" onClick={onClose} className="ops-btn-secondary">
                Close
              </button>
            </div>
          </div>
        ) : !card ? (
          <div className="flex flex-1 items-center justify-center text-sm text-[var(--text-secondary)]">
            Job not found.
          </div>
        ) : (
          <>
            <header
              className="ops-panel-header"
              style={{ borderLeft: `3px solid ${CATEGORY_ACCENT[card.columnCategory]}` }}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="ops-icon-btn"
                  aria-label="Close panel"
                >
                  <ChevronLeft className="size-4" strokeWidth={2.25} />
                </button>
                <div className="min-w-0 flex-1">
                  <input
                    defaultValue={card.title}
                    aria-label="Job title"
                    onBlur={(event) => {
                      if (event.target.value.trim() && event.target.value !== card.title) {
                        void patchCard({ title: event.target.value.trim() });
                      }
                    }}
                    className="w-full bg-transparent font-display text-xl font-semibold tracking-tight text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] focus:ring-0"
                  />
                  {propertyLabel ? (
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">{propertyLabel}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-start">
                  <details className="relative">
                    <summary className="ops-icon-btn cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                      <MoreVertical className="size-4" strokeWidth={2.25} />
                    </summary>
                    <div className="ops-menu">
                      <button
                        type="button"
                        onClick={() => void copyJobLink()}
                        className="ops-menu-item"
                      >
                        Copy job link
                      </button>
                      <button
                        type="button"
                        onClick={() => void copyPortalLink()}
                        className="ops-menu-item"
                      >
                        Copy portal link
                      </button>
                      <button
                        type="button"
                        onClick={() => void archiveJob()}
                        className="ops-menu-item"
                      >
                        Archive job
                      </button>
                    </div>
                  </details>
                  <select
                    value={card.columnId}
                    onChange={(event) => void attemptMove(event.target.value)}
                    aria-label="Pipeline column"
                    className="ops-control h-8 min-w-[7rem] py-0 text-xs"
                  >
                    {columns.map((column) => (
                      <option key={column.id} value={column.id}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={card.priority}
                    onChange={(event) => void patchCard({ priority: event.target.value })}
                    aria-label="Priority"
                    className="ops-control h-8 min-w-[5.5rem] py-0 text-xs capitalize"
                  >
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {currentColumn ? (
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
                  {currentColumn.stateKey.replace(/_/g, ' ')}
                </p>
              ) : null}
            </header>

            <div className="ops-tab-bar">
              <div className="flex gap-0.5 py-1.5">
                {TABS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTab(item.key)}
                    className={cn('ops-tab', tab === item.key && 'ops-tab--active')}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {error ? (
              <p className="ops-alert-error mx-4 mt-3">{error}</p>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col md:flex-row">
              <div className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
                {tab === 'overview' && (
                  <OverviewTab
                    card={card}
                    quote={payload.quote}
                    invoice={payload.invoice}
                    members={members}
                    changeOrders={changeOrders}
                    canManage={canManageMoney}
                    onCreateChangeOrder={createChangeOrder}
                    onPatch={patchCard}
                    onOpenEstimate={() => setTab('estimate')}
                    onCreateInvoice={createInvoice}
                    integrations={payload.integrations}
                    saving={saving}
                    aiContext={aiContext}
                  />
                )}
                {tab === 'property' && (
                  <PropertyTab card={card} onSave={saveCustomer} saving={saving} />
                )}
                {tab === 'scope' && <ScopeTab card={card} onPatch={patchCard} saving={saving} />}
                {tab === 'schedule' && (
                  <ScheduleTab card={card} members={members} onPatch={patchCard} saving={saving} />
                )}
                {tab === 'comments' && (
                  <CommentsTab
                    comments={payload.comments}
                    draft={commentDraft}
                    onDraftChange={setCommentDraft}
                    onSubmit={addComment}
                    saving={saving}
                  />
                )}
                {tab === 'checklist' && (
                  <ChecklistTab card={card} onPatch={patchCard} saving={saving} />
                )}
                {tab === 'estimate' && (
                  <EstimateTab
                    quote={payload.quote}
                    canManage={canManageMoney}
                    onSave={saveQuote}
                    onMarkSent={markQuoteSent}
                    onExport={exportEstimate}
                    onSend={sendEstimate}
                    onDraftFromAi={canManageMoney ? draftEstimateFromAi : undefined}
                    aiDraftLoading={aiDraftLoading}
                    saving={saving}
                  />
                )}
                {tab === 'money' && (
                  <>
                    {payload.integrations ? (
                      <div className="mb-4">
                        <IntegrationStrip integrations={payload.integrations} />
                      </div>
                    ) : null}
                    <MoneyTab
                    quote={payload.quote}
                    invoice={payload.invoice}
                    payment={payload.payment}
                    stripeEnabled={stripeEnabled}
                    canManage={canManageMoney}
                    onCreateInvoice={createInvoice}
                    onMarkPaid={markPaid}
                    onCreatePaymentLink={createPaymentLink}
                    onCopyPortalLink={copyPortalLink}
                    saving={saving}
                  />
                  </>
                )}
                {tab === 'comms' && (
                  <CommsTab
                    cardId={cardId}
                    canManage={canManageMoney}
                    twilioEnabled={twilioEnabled}
                    resendEnabled={resendEnabled}
                  />
                )}
                {tab === 'files' && (
                  <FilesTab
                    cardId={cardId}
                    canManage={canManageMoney}
                    onCopyPortalLink={copyPortalLink}
                  />
                )}

                <div className="mt-8 md:hidden">
                  <ActivityTimeline activities={payload.activities} />
                </div>
              </div>

              <aside className="hidden w-72 shrink-0 flex-col border-l border-[var(--topbar-border)] bg-[var(--surface-rail)] md:flex">
                <div className="flex-1 overflow-y-auto p-4">
                  <ActivityTimeline activities={payload.activities} />
                </div>
                {aiContext ? (
                  <AiRail
                    context={aiContext}
                    onRefresh={() => {
                      void loadCard(true);
                    }}
                  />
                ) : null}
              </aside>
            </div>
          </>
        )}
      </aside>

      {aiApproval && aiContext ? (
        <ApprovalModal
          toolCallId={aiApproval.toolCallId}
          toolName={aiApproval.toolName}
          preview={aiApproval.preview}
          context={aiContext}
          onClose={() => setAiApproval(null)}
          onComplete={() => {
            setAiApproval(null);
            void loadCard(true);
            setTab('estimate');
          }}
        />
      ) : null}

      {movePrompt ? (
        <MovePromptModal
          type={movePrompt.type}
          message={movePrompt.message}
          onCancel={() => setMovePrompt(null)}
          onConfirm={(value) => {
            if (movePrompt.type === 'schedule') {
              void attemptMove(movePrompt.targetColumnId, { scheduledStart: value });
            } else if (movePrompt.type === 'reason') {
              void attemptMove(movePrompt.targetColumnId, { reason: value });
            } else {
              setMovePrompt(null);
            }
          }}
        />
      ) : null}
    </>
  );
}

function OverviewTab({
  card,
  quote,
  invoice,
  members,
  changeOrders,
  canManage,
  onCreateChangeOrder,
  onPatch,
  onOpenEstimate,
  onCreateInvoice,
  integrations,
  saving,
  aiContext,
}: {
  card: CardDetailView;
  quote: QuoteView | null;
  invoice: InvoiceView | null;
  members: OrgMemberView[];
  changeOrders: Array<{ id: string; title: string }>;
  canManage: boolean;
  onCreateChangeOrder: () => Promise<void>;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  onOpenEstimate: () => void;
  onCreateInvoice: () => Promise<void>;
  integrations?: CardIntegrationSummary;
  saving: boolean;
  aiContext: {
    page: 'card';
    organizationId: string;
    userId: string;
    role: string;
    selectedCardId: string;
  } | null;
}) {
  const showEstimateCta =
    canManage &&
    ['estimating', 'estimate_sent', 'site_visit', 'inquiry'].includes(card.stateKey) &&
    (!quote || quote.total <= 0);

  const showInvoiceCta =
    canManage && ['complete', 'on_site', 'invoice_prep', 'invoice_sent'].includes(card.stateKey) && !invoice;

  return (
    <div className="space-y-4">
      {integrations ? <IntegrationStrip integrations={integrations} /> : null}

      {showEstimateCta || showInvoiceCta ? (
        <div className="ops-cta-bar">
          {showEstimateCta ? (
            <button type="button" onClick={onOpenEstimate} className="ops-btn-primary">
              Draft estimate
            </button>
          ) : null}
          {showInvoiceCta ? (
            <button
              type="button"
              disabled={saving || !quote || quote.total <= 0}
              onClick={() => void onCreateInvoice()}
              className="ops-btn-accent-outline"
            >
              Create invoice draft
            </button>
          ) : null}
        </div>
      ) : null}

      <Field label="Job type">
        <select
          value={card.jobType ?? ''}
          onChange={(event) => void onPatch({ jobType: event.target.value || null })}
          className="field-input"
          disabled={saving}
        >
          <option value="">Select type</option>
          {['maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Next action">
        <input
          defaultValue={card.nextAction ?? ''}
          onBlur={(event) => void onPatch({ nextAction: event.target.value || null })}
          className="field-input"
        />
      </Field>
      <Field label="Due date">
        <input
          type="date"
          defaultValue={card.dueDate?.slice(0, 10) ?? ''}
          onBlur={(event) =>
            void onPatch({
              dueDate: event.target.value ? `${event.target.value}T12:00:00.000Z` : null,
            })
          }
          className="field-input"
        />
      </Field>
      <Field label="Assignee">
        <select
          value={card.assignedTo ?? ''}
          onChange={(event) =>
            void onPatch({ assignedTo: event.target.value || null })
          }
          className="field-input"
          disabled={saving}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName ?? member.userId}
            </option>
          ))}
        </select>
      </Field>
      {canManage ? (
        <div className="ops-section-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold tracking-tight text-[var(--text-primary)]">
                Change orders
              </h4>
              <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                Linked amendment jobs for scope changes.
              </p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => void onCreateChangeOrder()}
              className="ops-btn-accent-outline"
            >
              New change order
            </button>
          </div>
          {changeOrders.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {changeOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-rail)] px-3 py-2"
                >
                  {order.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">No change orders yet.</p>
          )}
        </div>
      ) : null}
      {aiContext ? <CardAiSummary context={aiContext} cardTitle={card.title} /> : null}
    </div>
  );
}

function PropertyTab({
  card,
  onSave,
  saving,
}: {
  card: CardDetailView;
  onSave: (form: FormData) => Promise<void>;
  saving: boolean;
}) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(new FormData(event.currentTarget));
      }}
    >
      <Field label="Customer name">
        <input name="name" defaultValue={card.customer?.name ?? ''} required className="field-input" />
      </Field>
      <Field label="Phone">
        <input name="phone" defaultValue={card.customer?.phone ?? ''} className="field-input" />
      </Field>
      <Field label="Email">
        <input name="email" type="email" defaultValue={card.customer?.email ?? ''} className="field-input" />
      </Field>
      <Field label="Property address">
        <input name="address" defaultValue={card.customer?.address ?? ''} className="field-input" />
      </Field>
      <Field label="Access notes">
        <textarea name="notes" defaultValue={card.customer?.notes ?? ''} rows={3} className="field-input" />
      </Field>
      <button type="submit" disabled={saving} className="ops-btn-primary">
        Save property
      </button>
    </form>
  );
}

function ScopeTab({
  card,
  onPatch,
  saving,
}: {
  card: CardDetailView;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Job type">
        <select
          value={card.jobType ?? ''}
          onChange={(event) =>
            void onPatch({ jobType: event.target.value || null })
          }
          className="field-input"
          disabled={saving}
        >
          <option value="">Select type</option>
          {['maintenance', 'install', 'hardscape', 'cleanup', 'irrigation', 'other'].map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Scope / description">
        <textarea
          defaultValue={card.description ?? ''}
          rows={8}
          onBlur={(event) => void onPatch({ description: event.target.value || null })}
          className="field-input"
        />
      </Field>
    </div>
  );
}

function ScheduleTab({
  card,
  members,
  onPatch,
  saving,
}: {
  card: CardDetailView;
  members: OrgMemberView[];
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <Field label="Scheduled start">
        <input
          type="datetime-local"
          defaultValue={toLocalInput(card.scheduledStart)}
          onBlur={(event) =>
            void onPatch({
              scheduledStart: event.target.value
                ? new Date(event.target.value).toISOString()
                : null,
            })
          }
          className="field-input"
        />
      </Field>
      <Field label="Scheduled end">
        <input
          type="datetime-local"
          defaultValue={toLocalInput(card.scheduledEnd)}
          onBlur={(event) =>
            void onPatch({
              scheduledEnd: event.target.value
                ? new Date(event.target.value).toISOString()
                : null,
            })
          }
          className="field-input"
        />
      </Field>
      <Field label="Crew assignee">
        <select
          value={card.assignedTo ?? ''}
          onChange={(event) =>
            void onPatch({ assignedTo: event.target.value || null })
          }
          className="field-input"
          disabled={saving}
        >
          <option value="">Unassigned</option>
          {members.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.fullName ?? member.userId}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}

function CommentsTab({
  comments,
  draft,
  onDraftChange,
  onSubmit,
  saving,
}: {
  comments: CardCommentView[];
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: () => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="ops-section-card bg-[var(--surface-rail)] p-3"
            >
              <p className="text-sm text-[var(--text-primary)]">{comment.body}</p>
              <p className="mt-2 text-xs text-[var(--text-secondary)]">
                {comment.authorName ?? 'Team'} · {new Date(comment.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
      <textarea
        value={draft}
        onChange={(event) => onDraftChange(event.target.value)}
        rows={3}
        placeholder="Add a comment…"
        className="field-input"
      />
      <button
        type="button"
        disabled={saving || !draft.trim()}
        onClick={() => void onSubmit()}
        className="ops-btn-primary"
      >
        Post comment
      </button>
    </div>
  );
}

function ChecklistTab({
  card,
  onPatch,
  saving,
}: {
  card: CardDetailView;
  onPatch: (patch: Record<string, unknown>) => Promise<void>;
  saving: boolean;
}) {
  const [items, setItems] = useState(card.checklist);
  const [newItem, setNewItem] = useState('');

  useEffect(() => {
    setItems(card.checklist);
  }, [card.checklist]);

  const persist = (next: typeof items) => {
    setItems(next);
    void onPatch({ checklist: next });
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-secondary)]">No checklist items yet.</p>
      ) : (
        items.map((item) => (
          <label key={item.id} className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={item.done}
              disabled={saving}
              onChange={(event) => {
                persist(
                  items.map((entry) =>
                    entry.id === item.id ? { ...entry, done: event.target.checked } : entry,
                  ),
                );
              }}
            />
            <span className={item.done ? 'line-through text-[var(--text-secondary)]' : ''}>
              {item.text}
            </span>
          </label>
        ))
      )}
      <div className="flex gap-2">
        <input
          value={newItem}
          onChange={(event) => setNewItem(event.target.value)}
          placeholder="Add checklist item"
          className="field-input"
        />
        <button
          type="button"
          disabled={!newItem.trim() || saving}
          onClick={() => {
            persist([
              ...items,
              { id: crypto.randomUUID(), text: newItem.trim(), done: false },
            ]);
            setNewItem('');
          }}
          className="ops-btn-secondary shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="ops-field-label">{label}</span>
      {children}
    </label>
  );
}

function applyDetailPatch(card: CardDetailView, patch: Record<string, unknown>): CardDetailView {
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

function toLocalInput(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
