'use client';

import { useEffect, useState } from 'react';

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

function mergePayload(server: CardPayload, local: CardPayload | null): CardPayload {
  if (!local) {
    return server;
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
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [twilioEnabled, setTwilioEnabled] = useState(false);
  const [resendEnabled, setResendEnabled] = useState(false);
  const [changeOrders, setChangeOrders] = useState<Array<{ id: string; title: string }>>([]);

  const loadCard = async (syncBoard = false) => {
    if (!payload) {
      setLoading(true);
    } else {
      setHydrating(true);
    }
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

      setPayload((current) => mergePayload(data.data as CardPayload, current));
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
      setHydrating(false);
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
    stripeEnabled,
    twilioEnabled,
    resendEnabled,
    changeOrders,
    setChangeOrders,
    loadCard,
  };
}
