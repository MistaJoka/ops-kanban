'use client';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { QuoteView } from '@/lib/domain/money/quotes';
import type { CardIntegrationSummary } from '@/lib/domain/integrations/cardIntegrationSummary';
import { CardAiSummary } from '@/components/ai/CardAiSummary';
import { IntegrationStrip } from '@/components/card/IntegrationStrip';
import { Field } from '@/components/card/Field';

export function OverviewTab({
  card,
  quote,
  invoice,
  members,
  changeOrders,
  canManage,
  onCreateChangeOrder,
  onPatch,
  onOpenEstimate,
  onDraftEstimateFromAi,
  aiDraftLoading,
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
  onDraftEstimateFromAi?: () => void;
  aiDraftLoading?: boolean;
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
            <>
              <button
                type="button"
                disabled={aiDraftLoading}
                onClick={() => (onDraftEstimateFromAi ? onDraftEstimateFromAi() : onOpenEstimate())}
                className="ops-btn-primary"
              >
                {aiDraftLoading ? 'Drafting…' : 'AI draft estimate'}
              </button>
              <button type="button" onClick={onOpenEstimate} className="ops-btn-secondary">
                Edit manually
              </button>
            </>
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
