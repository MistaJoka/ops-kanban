'use client';

import type { CardDetailView } from '@/lib/domain/cards/cardDetail';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import { IntegrationStrip } from '@/components/card/IntegrationStrip';
import { ActivityTimeline } from '@/components/card/ActivityTimeline';
import { CommsTab } from '@/components/card/CommsTab';
import { FilesTab } from '@/components/card/FilesTab';
import { EstimateTab } from '@/components/card/EstimateTab';
import { MoneyTab } from '@/components/card/MoneyTab';
import { OverviewTab } from '@/components/card/tabs/OverviewTab';
import { PropertyTab } from '@/components/card/tabs/PropertyTab';
import { ScopeTab } from '@/components/card/tabs/ScopeTab';
import { ScheduleTab } from '@/components/card/tabs/ScheduleTab';
import { CommentsTab } from '@/components/card/tabs/CommentsTab';
import { ChecklistTab } from '@/components/card/tabs/ChecklistTab';
import { AiRail } from '@/components/ai/AiDock';
import type { CardPayload } from '@/components/card/useCardDetail';
import type { useCardMutations } from '@/components/card/useCardMutations';

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

type Mutations = ReturnType<typeof useCardMutations>;

export function CardPanelBody({
  tab,
  setTab,
  cardId,
  card,
  payload,
  members,
  changeOrders,
  canManageMoney,
  stripeEnabled,
  twilioEnabled,
  resendEnabled,
  mutations,
  onRefresh,
}: {
  tab: TabKey;
  setTab: (tab: TabKey) => void;
  cardId: string;
  card: CardDetailView;
  payload: CardPayload;
  members: OrgMemberView[];
  changeOrders: Array<{ id: string; title: string }>;
  canManageMoney: boolean;
  stripeEnabled: boolean;
  twilioEnabled: boolean;
  resendEnabled: boolean;
  mutations: Mutations;
  onRefresh: () => void;
}) {
  return (
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
            onCreateChangeOrder={mutations.createChangeOrder}
            onPatch={mutations.patchCard}
            onOpenEstimate={() => setTab('estimate')}
            onDraftEstimateFromAi={() => void mutations.draftEstimateFromAi()}
            aiDraftLoading={mutations.aiDraftLoading}
            onCreateInvoice={mutations.createInvoice}
            integrations={payload.integrations}
            saving={mutations.saving}
            aiContext={mutations.aiContext}
          />
        )}
        {tab === 'property' && (
          <PropertyTab card={card} onSave={mutations.saveCustomer} saving={mutations.saving} />
        )}
        {tab === 'scope' && (
          <ScopeTab card={card} onPatch={mutations.patchCard} saving={mutations.saving} />
        )}
        {tab === 'schedule' && (
          <ScheduleTab
            card={card}
            members={members}
            onPatch={mutations.patchCard}
            saving={mutations.saving}
          />
        )}
        {tab === 'comments' && (
          <CommentsTab
            comments={payload.comments}
            draft={mutations.commentDraft}
            onDraftChange={mutations.setCommentDraft}
            onSubmit={mutations.addComment}
            saving={mutations.saving}
          />
        )}
        {tab === 'checklist' && (
          <ChecklistTab card={card} onPatch={mutations.patchCard} saving={mutations.saving} />
        )}
        {tab === 'estimate' && (
          <EstimateTab
            quote={payload.quote}
            canManage={canManageMoney}
            onSave={mutations.saveQuote}
            onMarkSent={mutations.markQuoteSent}
            onExport={mutations.exportEstimate}
            onSend={mutations.openSendEstimateModal}
            onDraftFromAi={canManageMoney ? mutations.draftEstimateFromAi : undefined}
            aiDraftLoading={mutations.aiDraftLoading}
            saving={mutations.saving}
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
              onCreateInvoice={mutations.createInvoice}
              onMarkPaid={mutations.markPaid}
              onCreatePaymentLink={mutations.createPaymentLink}
              onCopyPortalLink={mutations.copyPortalLink}
              saving={mutations.saving}
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
            onCopyPortalLink={mutations.copyPortalLink}
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
        {mutations.aiContext ? (
          <AiRail context={mutations.aiContext} onRefresh={onRefresh} />
        ) : null}
      </aside>
    </div>
  );
}
