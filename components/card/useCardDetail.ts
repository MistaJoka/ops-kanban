'use client';

import { useEffect, useRef, useState } from 'react';

import { detailStubFromBoardCard } from '@/lib/domain/board/boardOptimistic';
import type { BoardCardView } from '@/lib/domain/cards/boardCard';
import type {
  CardActivityView,
  CardCommentView,
  CardDetailView,
} from '@/lib/domain/cards/cardDetail';
import type { OrgMemberView } from '@/lib/domain/organization/listMembers';
import type { PaymentView } from '@/lib/domain/integrations/payments';
import type { InvoiceView } from '@/lib/domain/money/invoices';
import type { QuoteView } from '@/lib/domain/money/quotes';
import type { CardIntegrationSummary } from '@/lib/domain/integrations/cardIntegrationSummary';
import type { BoardSyncHandlers } from '@/components/pipeline/useBoardState';
import { apiFetch } from '@/lib/client/apiFetch';

export type CardPayload = {
  card: CardDetailView;
  activities: CardActivityView[];
  comments: CardCommentView[];
  quote: QuoteView | null;
  invoice: InvoiceView | null;
  payment: PaymentView | null;
  integrations?: CardIntegrationSummary;
};

function buildStubPayload(card: BoardCardView): CardPayload {
  return {
    card: detailStubFromBoardCard(card),
    activities: [],
    comments: [],
    quote: null,
    invoice: null,
    payment: null,
  };
}

function mergePayload(
  server: CardPayload,
  local: CardPayload | null,
  hasPendingLocalChanges: boolean,
): CardPayload {
  if (!local) {
    return server;
  }

  if (hasPendingLocalChanges) {
    return {
      ...server,
      card: {
        ...server.card,
        ...local.card,
        customer: server.card.customer ?? local.card.customer,
      },
    };
  }

  const localUpdated = new Date(local.card.updatedAt).getTime();
  const serverUpdated = new Date(server.card.updatedAt).getTime();

  if (localUpdated > serverUpdated) {
    return {
      ...server,
      card: {
        ...server.card,
        ...local.card,
        customer: server.card.customer ?? local.card.customer,
      },
    };
  }

  return server;
}

export function useCardDetail(
  cardId: string,
  boardSync: BoardSyncHandlers,
  initialBoardCard?: BoardCardView,
) {
  const [payload, setPayload] = useState<CardPayload | null>(() =>
    initialBoardCard ? buildStubPayload(initialBoardCard) : null,
  );
  const [members, setMembers] = useState<OrgMemberView[]>([]);
  const [loading, setLoading] = useState(!initialBoardCard);
  const [hydrating, setHydrating] = useState(Boolean(initialBoardCard));
  const [error, setError] = useState<string | null>(null);
  const [paypalEnabled, setPaypalEnabled] = useState(false);
  const [twilioEnabled, setTwilioEnabled] = useState(false);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [changeOrders, setChangeOrders] = useState<Array<{ id: string; title: string }>>([]);
  const loadRequestRef = useRef(0);

  const loadCard = async (syncBoard = false) => {
    const requestId = ++loadRequestRef.current;

    if (!payload) {
      setLoading(true);
    } else {
      setHydrating(true);
    }
    setError(null);

    try {
      const [cardResult, changeOrderResult] = await Promise.all([
        apiFetch<CardPayload>(`/api/cards/${cardId}`),
        apiFetch<Array<{ id: string; title: string }>>(`/api/cards/${cardId}/change-orders`),
      ]);

      if (requestId !== loadRequestRef.current) {
        return;
      }

      if (!cardResult.ok) {
        throw new Error(cardResult.error);
      }

      const hasPendingLocalChanges = boardSync.hasPendingForCard(cardId);
      setPayload((current) =>
        mergePayload(cardResult.data as CardPayload, current, hasPendingLocalChanges),
      );
      if (syncBoard && cardResult.data?.card) {
        boardSync.syncFromDetail(cardResult.data.card);
      }
      if (changeOrderResult.ok && changeOrderResult.data) {
        setChangeOrders(changeOrderResult.data);
      }
    } catch (loadError) {
      if (requestId !== loadRequestRef.current) {
        return;
      }
      setError(loadError instanceof Error ? loadError.message : 'Failed to load card.');
    } finally {
      if (requestId === loadRequestRef.current) {
        setLoading(false);
        setHydrating(false);
      }
    }
  };

  useEffect(() => {
    if (initialBoardCard) {
      setPayload(buildStubPayload(initialBoardCard));
      setLoading(false);
      setHydrating(true);
    } else {
      setPayload(null);
      setLoading(true);
      setHydrating(false);
    }
  }, [cardId, initialBoardCard]);

  useEffect(() => {
    void loadCard();
    void apiFetch<OrgMemberView[]>('/api/members').then((result) => {
      if (result.ok) setMembers(result.data);
    });
    void apiFetch<{ paypal?: { configured?: boolean; status?: string }; twilio?: { configured?: boolean; status?: string }; resend?: { configured?: boolean } }>(
      '/api/integrations',
    ).then((result) => {
      if (!result.ok) return;
      const paypal = result.data?.paypal;
      if (paypal?.configured && paypal.status === 'active') {
        setPaypalEnabled(true);
      }
      const twilio = result.data?.twilio;
      if (twilio?.configured && twilio.status === 'active') {
        setTwilioEnabled(true);
      }
      if (result.data?.resend?.configured) {
        setResendEnabled(true);
      }
    });
  }, [cardId]);

  useEffect(() => {
    return () => {
      boardSync.flush(cardId);
    };
  }, [boardSync, cardId]);

  return {
    payload,
    setPayload,
    members,
    loading,
    hydrating,
    error,
    setError,
    paypalEnabled,
    twilioEnabled,
    resendEnabled,
    changeOrders,
    setChangeOrders,
    loadCard,
  };
}
